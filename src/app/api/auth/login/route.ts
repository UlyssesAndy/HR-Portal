import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cookies } from "next/headers";
import { encode } from "next-auth/jwt";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = body.email?.trim().toLowerCase();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    const userDomain = email.split("@")[1];
    const allowedDomains = (process.env.ALLOWED_EMAIL_DOMAINS || "")
      .split(",")
      .map((d) => d.trim().toLowerCase())
      .filter(Boolean);

    // Check if domain is allowed
    let isAllowed = allowedDomains.length === 0 || allowedDomains.includes(userDomain);

    if (!isAllowed) {
      // Check for existing employee or invitation
      const existingEmployee = await db.employee.findUnique({
        where: { email },
      });

      if (!existingEmployee) {
        const invitation = await db.invitation.findFirst({
          where: {
            email,
            status: "PENDING",
            expiresAt: { gt: new Date() },
          },
        });

        if (!invitation) {
          return NextResponse.json(
            { error: "Access denied: email domain not allowed" },
            { status: 403 }
          );
        }
      }
    }

    // Find or create employee
    let employee = await db.employee.findUnique({
      where: { email },
      include: {
        roleAssignments: {
          where: {
            OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
          },
        },
      },
    });

    if (!employee) {
      employee = await db.employee.create({
        data: {
          email,
          fullName: email.split("@")[0],
          status: "PENDING",
          isSyncedFromGoogle: false,
          isExternal: !allowedDomains.includes(userDomain),
          roleAssignments: {
            create: [{ role: "EMPLOYEE" }],
          },
        },
        include: {
          roleAssignments: {
            where: {
              OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
            },
          },
        },
      });

      // Mark invitation as accepted if exists
      await db.invitation.updateMany({
        where: { email, status: "PENDING" },
        data: { status: "ACCEPTED", acceptedAt: new Date() },
      });
    }

    // Create session token - structure must match NextAuth expectations
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

    // Create or get credentials and session
    try {
      const credentials = await db.userCredentials.upsert({
        where: { employeeId: employee.id },
        update: {
          lastLoginAt: new Date(),
          lastLoginIp: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || null,
        },
        create: {
          employeeId: employee.id,
          lastLoginAt: new Date(),
          lastLoginIp: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || null,
        },
      });

      // Create session record
      await db.userSession.create({
        data: {
          credentialsId: credentials.id,
          sessionToken: token.slice(0, 64),
          ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || null,
          userAgent: request.headers.get("user-agent"),
          deviceInfo: parseUserAgent(request.headers.get("user-agent")),
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });
    } catch (e) {
      // Non-critical - session tracking is optional
      console.error("Session creation error:", e);
    }

    // Audit log
    await db.auditEvent.create({
      data: {
        actorId: employee.id,
        actorEmail: email,
        action: "auth.login",
        resourceType: "employee",
        resourceId: employee.id,
        metadata: { provider: "email-direct" },
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
    console.error("Login error:", error);
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
