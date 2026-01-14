import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateMagicLinkToken, getMagicLinkExpiry, generateMagicLinkUrl } from "@/lib/auth/magic-link";
import { sendMagicLinkEmail } from "@/lib/email";

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

    // Check domain access
    const userDomain = email.split("@")[1];
    const allowedDomains = (process.env.ALLOWED_EMAIL_DOMAINS || "")
      .split(",")
      .map((d) => d.trim().toLowerCase())
      .filter(Boolean);

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
          // Don't reveal if email exists or not for security
          return NextResponse.json({ 
            success: true,
            message: "If this email is registered, you will receive a magic link shortly."
          });
        }
      }
    }

    // Generate magic link token
    const token = generateMagicLinkToken();
    const expiresAt = getMagicLinkExpiry();

    // Get or create employee
    let employee = await db.employee.findUnique({
      where: { email },
    });

    if (!employee) {
      // Create employee
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
      });
    }

    // Get or create credentials
    await db.userCredentials.upsert({
      where: { employeeId: employee.id },
      update: {
        magicLinkToken: token,
        magicLinkExpiresAt: expiresAt,
      },
      create: {
        employeeId: employee.id,
        magicLinkToken: token,
        magicLinkExpiresAt: expiresAt,
      },
    });

    // Generate magic link URL
    const baseUrl = process.env.NEXTAUTH_URL || `${request.nextUrl.protocol}//${request.nextUrl.host}`;
    const magicLinkUrl = generateMagicLinkUrl(token, baseUrl);

    // Send email
    await sendMagicLinkEmail(email, magicLinkUrl);

    // Audit log
    await db.auditEvent.create({
      data: {
        actorId: employee.id,
        actorEmail: email,
        action: "auth.magic_link_requested",
        resourceType: "employee",
        resourceId: employee.id,
      },
    });

    return NextResponse.json({ 
      success: true,
      message: "If this email is registered, you will receive a magic link shortly."
    });
  } catch (error) {
    console.error("Magic link error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
