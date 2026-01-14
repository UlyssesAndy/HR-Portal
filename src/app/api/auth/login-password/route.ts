import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cookies } from "next/headers";
import { encode } from "next-auth/jwt";
import { verifyPassword } from "@/lib/auth/password";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, totpCode } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Find employee
    const employee = await db.employee.findUnique({
      where: { email: normalizedEmail },
      include: {
        credentials: true,
        roleAssignments: {
          where: {
            OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
          },
        },
      },
    });

    if (!employee) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    if (!employee.credentials?.passwordHash) {
      return NextResponse.json(
        { error: "Password login not enabled for this account" },
        { status: 401 }
      );
    }

    // Check if account is locked
    if (employee.credentials.lockedUntil && employee.credentials.lockedUntil > new Date()) {
      const remainingMinutes = Math.ceil(
        (employee.credentials.lockedUntil.getTime() - Date.now()) / 60000
      );
      return NextResponse.json(
        { error: `Account locked. Try again in ${remainingMinutes} minutes.` },
        { status: 423 }
      );
    }

    // Verify password
    const isValid = await verifyPassword(password, employee.credentials.passwordHash);

    if (!isValid) {
      // Increment failed attempts
      const failedAttempts = employee.credentials.failedAttempts + 1;
      const lockAccount = failedAttempts >= 5;

      await db.userCredentials.update({
        where: { id: employee.credentials.id },
        data: {
          failedAttempts,
          lockedUntil: lockAccount ? new Date(Date.now() + 15 * 60 * 1000) : null,
        },
      });

      return NextResponse.json(
        { 
          error: "Invalid email or password",
          attemptsRemaining: lockAccount ? 0 : 5 - failedAttempts,
        },
        { status: 401 }
      );
    }

    // Check 2FA if enabled
    if (employee.credentials.totpEnabled) {
      if (!totpCode) {
        return NextResponse.json(
          { 
            error: "2FA code required",
            requires2FA: true,
          },
          { status: 403 }
        );
      }

      // Verify TOTP
      const { verifyTotpToken } = await import("@/lib/auth/totp");
      const isValidTotp = verifyTotpToken(totpCode, employee.credentials.totpSecret!);

      if (!isValidTotp) {
        // Check backup codes
        const backupCodes = (employee.credentials.backupCodes as string[]) || [];
        const normalizedCode = totpCode.replace("-", "").toUpperCase();
        const codeIndex = backupCodes.indexOf(normalizedCode);

        if (codeIndex === -1) {
          return NextResponse.json(
            { error: "Invalid 2FA code" },
            { status: 401 }
          );
        }

        // Remove used backup code
        backupCodes.splice(codeIndex, 1);
        await db.userCredentials.update({
          where: { id: employee.credentials.id },
          data: { backupCodes },
        });
      }
    }

    // Reset failed attempts on successful login
    await db.userCredentials.update({
      where: { id: employee.credentials.id },
      data: {
        failedAttempts: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
        lastLoginIp: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || null,
      },
    });

    // Create session token
    const roles = employee.roleAssignments.map((r) => r.role);

    const token = await encode({
      token: {
        sub: employee.id,
        id: employee.id,
        email: employee.email,
        name: employee.fullName,
        picture: employee.avatarUrl,
        roles,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
        jti: crypto.randomUUID(),
      },
      secret: process.env.AUTH_SECRET!,
      salt: "authjs.session-token",
    });

    // Set cookie
    const cookieStore = await cookies();
    cookieStore.set("authjs.session-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60,
    });

    // Create session record
    await db.userSession.create({
      data: {
        credentialsId: employee.credentials.id,
        sessionToken: token.slice(0, 64), // Store partial token for identification
        ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || null,
        userAgent: request.headers.get("user-agent"),
        deviceInfo: parseUserAgent(request.headers.get("user-agent")),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    // Audit log
    await db.auditEvent.create({
      data: {
        actorId: employee.id,
        actorEmail: employee.email,
        action: "auth.login_password",
        resourceType: "employee",
        resourceId: employee.id,
        metadata: { provider: "password" },
      },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: employee.id,
        email: employee.email,
        name: employee.fullName,
        roles,
      },
    });
  } catch (error) {
    console.error("Password login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

function parseUserAgent(userAgent: string | null): string {
  if (!userAgent) return "Unknown Device";

  if (userAgent.includes("Windows")) return "Windows PC";
  if (userAgent.includes("Mac")) return "Mac";
  if (userAgent.includes("iPhone")) return "iPhone";
  if (userAgent.includes("iPad")) return "iPad";
  if (userAgent.includes("Android")) return "Android Device";
  if (userAgent.includes("Linux")) return "Linux PC";

  return "Unknown Device";
}
