import nodemailer from "nodemailer";

// For development, we'll use a console logger
// In production, replace with real SMTP config
const isDev = process.env.NODE_ENV === "development";

const transporter = isDev
  ? null
  : nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

async function sendEmail(options: EmailOptions): Promise<void> {
  if (isDev) {
    console.log("=== DEV EMAIL ===");
    console.log(`To: ${options.to}`);
    console.log(`Subject: ${options.subject}`);
    console.log(`Body: ${options.text || options.html}`);
    console.log("=================");
    return;
  }

  if (!transporter) {
    throw new Error("Email transporter not configured");
  }

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || "HR Portal <noreply@hrportal.local>",
    ...options,
  });
}

// Magic Link Email
export async function sendMagicLinkEmail(
  email: string,
  token: string
): Promise<void> {
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const magicLink = `${baseUrl}/api/auth/verify-magic-link?token=${token}`;

  await sendEmail({
    to: email,
    subject: "Sign in to HR Portal",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Sign in to HR Portal</h2>
        <p>Click the link below to sign in to your account:</p>
        <a href="${magicLink}" style="display: inline-block; background-color: #0070f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">
          Sign In
        </a>
        <p style="color: #666; font-size: 14px;">This link will expire in 15 minutes.</p>
        <p style="color: #666; font-size: 14px;">If you didn't request this email, you can safely ignore it.</p>
      </div>
    `,
    text: `Sign in to HR Portal: ${magicLink}\n\nThis link will expire in 15 minutes.`,
  });
}

// 2FA Enabled Notification
export async function send2FAEnabledEmail(email: string): Promise<void> {
  await sendEmail({
    to: email,
    subject: "Two-Factor Authentication Enabled - HR Portal",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Two-Factor Authentication Enabled</h2>
        <p>Two-factor authentication has been successfully enabled on your HR Portal account.</p>
        <p>From now on, you'll need to enter a verification code from your authenticator app when signing in.</p>
        <div style="background-color: #fef3cd; border: 1px solid #ffc107; padding: 16px; border-radius: 6px; margin: 16px 0;">
          <strong>Important:</strong> Make sure you've saved your backup codes in a safe place. You'll need them if you lose access to your authenticator app.
        </div>
        <p style="color: #666; font-size: 14px;">If you didn't make this change, please contact your administrator immediately.</p>
      </div>
    `,
    text: `Two-factor authentication has been enabled on your HR Portal account. Make sure you've saved your backup codes in a safe place.`,
  });
}

// 2FA Disabled Notification
export async function send2FADisabledEmail(email: string): Promise<void> {
  await sendEmail({
    to: email,
    subject: "Two-Factor Authentication Disabled - HR Portal",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Two-Factor Authentication Disabled</h2>
        <p>Two-factor authentication has been disabled on your HR Portal account.</p>
        <div style="background-color: #f8d7da; border: 1px solid #f5c6cb; padding: 16px; border-radius: 6px; margin: 16px 0;">
          <strong>Security Notice:</strong> Your account is now less secure without 2FA. We recommend re-enabling it as soon as possible.
        </div>
        <p style="color: #666; font-size: 14px;">If you didn't make this change, please contact your administrator immediately and change your password.</p>
      </div>
    `,
    text: `Two-factor authentication has been disabled on your HR Portal account. If you didn't make this change, please contact your administrator immediately.`,
  });
}

// Password Changed Notification
export async function sendPasswordChangedEmail(email: string): Promise<void> {
  await sendEmail({
    to: email,
    subject: "Password Changed - HR Portal",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Password Changed</h2>
        <p>Your HR Portal password has been successfully changed.</p>
        <p style="color: #666; font-size: 14px;">If you didn't make this change, please contact your administrator immediately.</p>
      </div>
    `,
    text: `Your HR Portal password has been successfully changed. If you didn't make this change, please contact your administrator immediately.`,
  });
}

// New Session Alert
export async function sendNewSessionEmail(
  email: string,
  deviceInfo: string,
  ipAddress: string
): Promise<void> {
  await sendEmail({
    to: email,
    subject: "New Sign-In to Your HR Portal Account",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">New Sign-In Detected</h2>
        <p>A new sign-in to your HR Portal account was detected:</p>
        <ul style="background-color: #f8f9fa; padding: 16px 32px; border-radius: 6px;">
          <li><strong>Device:</strong> ${deviceInfo}</li>
          <li><strong>IP Address:</strong> ${ipAddress}</li>
          <li><strong>Time:</strong> ${new Date().toLocaleString()}</li>
        </ul>
        <p style="color: #666; font-size: 14px;">If this was you, no action is needed. If you don't recognize this activity, please secure your account immediately.</p>
      </div>
    `,
    text: `New sign-in to your HR Portal account. Device: ${deviceInfo}, IP: ${ipAddress}. If you don't recognize this activity, please secure your account.`,
  });
}
