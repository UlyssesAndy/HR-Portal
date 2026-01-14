import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { hashPassword, validatePasswordStrength } from "@/lib/auth/password";

// POST - Set or change password
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { password, currentPassword } = body;

    if (!password) {
      return NextResponse.json(
        { error: "Password is required" },
        { status: 400 }
      );
    }

    // Validate password strength
    const validation = validatePasswordStrength(password);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: "Password too weak", details: validation.errors },
        { status: 400 }
      );
    }

    // Get or create credentials
    let credentials = await db.userCredentials.findUnique({
      where: { employeeId: session.user.id },
    });

    // If credentials exist with password, verify current password
    if (credentials?.passwordHash && currentPassword) {
      const { verifyPassword } = await import("@/lib/auth/password");
      const isValid = await verifyPassword(currentPassword, credentials.passwordHash);
      if (!isValid) {
        return NextResponse.json(
          { error: "Current password is incorrect" },
          { status: 400 }
        );
      }
    }

    const passwordHash = await hashPassword(password);

    if (credentials) {
      await db.userCredentials.update({
        where: { id: credentials.id },
        data: {
          passwordHash,
          passwordSetAt: new Date(),
        },
      });
    } else {
      await db.userCredentials.create({
        data: {
          employeeId: session.user.id,
          passwordHash,
          passwordSetAt: new Date(),
        },
      });
    }

    // Audit log
    await db.auditEvent.create({
      data: {
        actorId: session.user.id,
        actorEmail: session.user.email,
        action: credentials?.passwordHash ? "auth.password_changed" : "auth.password_set",
        resourceType: "user_credentials",
        resourceId: session.user.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Password update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET - Check if user has password set
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const credentials = await db.userCredentials.findUnique({
      where: { employeeId: session.user.id },
      select: {
        passwordHash: true,
        passwordSetAt: true,
        totpEnabled: true,
      },
    });

    return NextResponse.json({
      hasPassword: !!credentials?.passwordHash,
      passwordSetAt: credentials?.passwordSetAt,
      has2FA: credentials?.totpEnabled || false,
    });
  } catch (error) {
    console.error("Password check error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
