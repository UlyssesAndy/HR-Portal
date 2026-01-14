import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "Current password and new password are required" },
        { status: 400 }
      );
    }

    // Validate new password strength
    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long" },
        { status: 400 }
      );
    }

    if (!/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/[0-9]/.test(newPassword) || !/[!@#$%^&*]/.test(newPassword)) {
      return NextResponse.json(
        { error: "Password must contain uppercase, lowercase, number, and special character" },
        { status: 400 }
      );
    }

    // Get employee with credentials
    const employee = await db.employee.findUnique({
      where: { id: session.user.id },
      include: { credentials: true },
    });

    if (!employee || !employee.credentials?.passwordHash) {
      return NextResponse.json(
        { error: "User credentials not found" },
        { status: 404 }
      );
    }

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, employee.credentials.passwordHash);

    if (!isValid) {
      return NextResponse.json(
        { error: "Current password is incorrect" },
        { status: 401 }
      );
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 12);

    // Update password and clear requirePasswordChange flag
    await db.userCredentials.update({
      where: { id: employee.credentials.id },
      data: {
        passwordHash: newPasswordHash,
        passwordSetAt: new Date(),
        requirePasswordChange: false,
        failedAttempts: 0,
        lockedUntil: null,
      },
    });

    // Audit log
    await db.auditEvent.create({
      data: {
        actorId: employee.id,
        actorEmail: employee.email,
        action: "auth.password_changed",
        resourceType: "employee",
        resourceId: employee.id,
        metadata: { method: "manual" },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Change password error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
