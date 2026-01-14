import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { Prisma } from "@prisma/client";
import {
  generateTotpSecret,
  generateTotpUri,
  generateQrCodeDataUrl,
  verifyTotpToken,
  generateBackupCodes,
  formatBackupCode,
} from "@/lib/auth/totp";
import { send2FAEnabledEmail } from "@/lib/email";

// GET - Start 2FA setup (generate secret and QR code)
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if 2FA is already enabled
    const credentials = await db.userCredentials.findUnique({
      where: { employeeId: session.user.id },
    });

    if (credentials?.totpEnabled) {
      return NextResponse.json(
        { error: "2FA is already enabled" },
        { status: 400 }
      );
    }

    // Generate new secret
    const secret = generateTotpSecret();
    const uri = generateTotpUri(session.user.email, secret);
    const qrCode = await generateQrCodeDataUrl(uri);

    // Temporarily store the secret (not yet verified)
    await db.userCredentials.upsert({
      where: { employeeId: session.user.id },
      update: { totpSecret: secret },
      create: {
        employeeId: session.user.id,
        totpSecret: secret,
      },
    });

    return NextResponse.json({
      secret,
      qrCode,
      manualEntry: {
        account: session.user.email,
        issuer: "HR Portal",
        secret,
      },
    });
  } catch (error) {
    console.error("2FA setup error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Verify and enable 2FA
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { code } = body;

    if (!code) {
      return NextResponse.json(
        { error: "Verification code is required" },
        { status: 400 }
      );
    }

    const credentials = await db.userCredentials.findUnique({
      where: { employeeId: session.user.id },
    });

    if (!credentials?.totpSecret) {
      return NextResponse.json(
        { error: "2FA setup not initiated. Please start setup first." },
        { status: 400 }
      );
    }

    if (credentials.totpEnabled) {
      return NextResponse.json(
        { error: "2FA is already enabled" },
        { status: 400 }
      );
    }

    // Verify the code
    const isValid = verifyTotpToken(code, credentials.totpSecret);

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid verification code. Please try again." },
        { status: 400 }
      );
    }

    // Generate backup codes
    const backupCodes = generateBackupCodes(10);

    // Enable 2FA
    await db.userCredentials.update({
      where: { id: credentials.id },
      data: {
        totpEnabled: true,
        totpEnabledAt: new Date(),
        backupCodes,
      },
    });

    // Send confirmation email
    await send2FAEnabledEmail(session.user.email);

    // Audit log
    await db.auditEvent.create({
      data: {
        actorId: session.user.id,
        actorEmail: session.user.email,
        action: "auth.2fa_enabled",
        resourceType: "user_credentials",
        resourceId: session.user.id,
      },
    });

    return NextResponse.json({
      success: true,
      backupCodes: backupCodes.map(formatBackupCode),
      message: "2FA has been enabled. Please save your backup codes securely.",
    });
  } catch (error) {
    console.error("2FA verify error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Disable 2FA
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { code, password } = body;

    const credentials = await db.userCredentials.findUnique({
      where: { employeeId: session.user.id },
    });

    if (!credentials?.totpEnabled) {
      return NextResponse.json(
        { error: "2FA is not enabled" },
        { status: 400 }
      );
    }

    // Require either TOTP code or password for security
    if (code) {
      const isValid = verifyTotpToken(code, credentials.totpSecret!);
      if (!isValid) {
        return NextResponse.json(
          { error: "Invalid verification code" },
          { status: 400 }
        );
      }
    } else if (password && credentials.passwordHash) {
      const { verifyPassword } = await import("@/lib/auth/password");
      const isValid = await verifyPassword(password, credentials.passwordHash);
      if (!isValid) {
        return NextResponse.json(
          { error: "Invalid password" },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json(
        { error: "Verification code or password required" },
        { status: 400 }
      );
    }

    // Disable 2FA
    await db.userCredentials.update({
      where: { id: credentials.id },
      data: {
        totpEnabled: false,
        totpSecret: null,
        totpEnabledAt: null,
        backupCodes: Prisma.JsonNull,
      },
    });

    // Audit log
    await db.auditEvent.create({
      data: {
        actorId: session.user.id,
        actorEmail: session.user.email,
        action: "auth.2fa_disabled",
        resourceType: "user_credentials",
        resourceId: session.user.id,
      },
    });

    return NextResponse.json({
      success: true,
      message: "2FA has been disabled",
    });
  } catch (error) {
    console.error("2FA disable error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
