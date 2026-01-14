import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cookies } from "next/headers";
import { encode } from "next-auth/jwt";
import { isMagicLinkExpired } from "@/lib/auth/magic-link";

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get("token");

    if (!token) {
      return NextResponse.redirect(new URL("/login?error=invalid_token", request.url));
    }

    // Find credentials with this token
    const credentials = await db.userCredentials.findFirst({
      where: { magicLinkToken: token },
      include: {
        employee: {
          include: {
            roleAssignments: {
              where: {
                OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
              },
            },
          },
        },
      },
    });

    if (!credentials || !credentials.magicLinkExpiresAt) {
      return NextResponse.redirect(new URL("/login?error=invalid_token", request.url));
    }

    // Check if expired
    if (isMagicLinkExpired(credentials.magicLinkExpiresAt)) {
      // Clear the expired token
      await db.userCredentials.update({
        where: { id: credentials.id },
        data: {
          magicLinkToken: null,
          magicLinkExpiresAt: null,
        },
      });

      return NextResponse.redirect(new URL("/login?error=link_expired", request.url));
    }

    const employee = credentials.employee;

    // Clear the used token
    await db.userCredentials.update({
      where: { id: credentials.id },
      data: {
        magicLinkToken: null,
        magicLinkExpiresAt: null,
        lastLoginAt: new Date(),
        lastLoginIp: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || null,
      },
    });

    // Create session token
    const roles = employee.roleAssignments.map((r) => r.role);

    const sessionToken = await encode({
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
    cookieStore.set("authjs.session-token", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60,
    });

    // Create session record
    await db.userSession.create({
      data: {
        credentialsId: credentials.id,
        sessionToken: sessionToken.slice(0, 64),
        ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || null,
        userAgent: request.headers.get("user-agent"),
        deviceInfo: parseUserAgent(request.headers.get("user-agent")),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    // Mark invitation as accepted if exists
    await db.invitation.updateMany({
      where: { email: employee.email, status: "PENDING" },
      data: { status: "ACCEPTED", acceptedAt: new Date() },
    });

    // Audit log
    await db.auditEvent.create({
      data: {
        actorId: employee.id,
        actorEmail: employee.email,
        action: "auth.login_magic_link",
        resourceType: "employee",
        resourceId: employee.id,
        metadata: { provider: "magic-link" },
      },
    });

    // Redirect to dashboard
    return NextResponse.redirect(new URL("/", request.url));
  } catch (error) {
    console.error("Magic link verification error:", error);
    return NextResponse.redirect(new URL("/login?error=server_error", request.url));
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
