import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * EMERGENCY ENDPOINT: Disable 2FA for a specific user
 * Only for development/recovery purposes
 * 
 * Usage: POST /api/auth/disable-2fa-emergency
 * Body: { "email": "user@example.com", "secret": "EMERGENCY_SECRET" }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, secret } = body;

    // Security check - require emergency secret
    const EMERGENCY_SECRET = process.env.EMERGENCY_SECRET || "change-me-in-production";
    
    if (secret !== EMERGENCY_SECRET) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Find employee
    const employee = await db.employee.findUnique({
      where: { email: normalizedEmail },
      include: { credentials: true },
    });

    if (!employee) {
      return NextResponse.json(
        { error: "Employee not found" },
        { status: 404 }
      );
    }

    if (!employee.credentials) {
      return NextResponse.json(
        { error: "No credentials found" },
        { status: 404 }
      );
    }

    // Disable 2FA
    await db.userCredentials.update({
      where: { id: employee.credentials.id },
      data: {
        totpEnabled: false,
        totpSecret: null,
        backupCodes: [],
      },
    });

    // Create audit log
    await db.auditEvent.create({
      data: {
        actorId: null,
        actorEmail: "system",
        action: "auth.2fa_emergency_disable",
        resourceType: "employee",
        resourceId: employee.id,
        metadata: {
          email: normalizedEmail,
          reason: "emergency_disable",
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "2FA disabled successfully",
      employee: {
        id: employee.id,
        email: employee.email,
        name: employee.fullName,
        totpEnabled: false,
      },
    });
  } catch (error) {
    console.error("Disable 2FA error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
