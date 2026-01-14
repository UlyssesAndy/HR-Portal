import nodemailer from "nodemailer";

// Email configuration - uses environment variables
const getTransporter = () => {
  // For development, use ethereal email or console logging
  if (process.env.NODE_ENV !== "production" && !process.env.SMTP_HOST) {
    return null; // Will log to console instead
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "localhost",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true",
    auth: process.env.SMTP_USER
      ? {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD,
        }
      : undefined,
  });
};

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  const transporter = getTransporter();

  const emailData = {
    from: process.env.SMTP_FROM || "HR Portal <noreply@hr-portal.local>",
    ...options,
  };

  if (!transporter) {
    // Development mode - log to console
    console.log("📧 Email (dev mode):");
    console.log(`   To: ${options.to}`);
    console.log(`   Subject: ${options.subject}`);
    console.log(`   Content: ${options.text || "See HTML"}`);
    console.log("---");
    return true;
  }

  try {
    await transporter.sendMail(emailData);
    return true;
  } catch (error) {
    console.error("Failed to send email:", error);
    return false;
  }
}

export async function sendMagicLinkEmail(
  email: string,
  magicLinkUrl: string
): Promise<boolean> {
  return sendEmail({
    to: email,
    subject: "Sign in to HR Portal",
    text: `Click this link to sign in: ${magicLinkUrl}\n\nThis link expires in 15 minutes.`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f4f4f5; padding: 40px 20px;">
          <div style="max-width: 480px; margin: 0 auto; background: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <h1 style="color: #1e293b; font-size: 24px; margin-bottom: 24px; text-align: center;">
              🔐 Sign in to HR Portal
            </h1>
            <p style="color: #475569; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
              Click the button below to sign in to your account. This link will expire in <strong>15 minutes</strong>.
            </p>
            <div style="text-align: center; margin: 32px 0;">
              <a href="${magicLinkUrl}" 
                 style="display: inline-block; background: linear-gradient(135deg, #3b82f6, #2563eb); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                Sign In
              </a>
            </div>
            <p style="color: #94a3b8; font-size: 14px; text-align: center; margin-top: 24px;">
              If you didn't request this email, you can safely ignore it.
            </p>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 32px 0;">
            <p style="color: #94a3b8; font-size: 12px; text-align: center;">
              HR Portal • Secure Authentication
            </p>
          </div>
        </body>
      </html>
    `,
  });
}

export async function sendPasswordResetEmail(
  email: string,
  resetUrl: string
): Promise<boolean> {
  return sendEmail({
    to: email,
    subject: "Reset your HR Portal password",
    text: `Click this link to reset your password: ${resetUrl}\n\nThis link expires in 1 hour.`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f4f4f5; padding: 40px 20px;">
          <div style="max-width: 480px; margin: 0 auto; background: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <h1 style="color: #1e293b; font-size: 24px; margin-bottom: 24px; text-align: center;">
              🔑 Reset Your Password
            </h1>
            <p style="color: #475569; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
              We received a request to reset your password. Click the button below to create a new password. This link expires in <strong>1 hour</strong>.
            </p>
            <div style="text-align: center; margin: 32px 0;">
              <a href="${resetUrl}" 
                 style="display: inline-block; background: linear-gradient(135deg, #f59e0b, #d97706); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                Reset Password
              </a>
            </div>
            <p style="color: #94a3b8; font-size: 14px; text-align: center; margin-top: 24px;">
              If you didn't request this, please ignore this email or contact support if you have concerns.
            </p>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 32px 0;">
            <p style="color: #94a3b8; font-size: 12px; text-align: center;">
              HR Portal • Secure Authentication
            </p>
          </div>
        </body>
      </html>
    `,
  });
}

export async function send2FAEnabledEmail(email: string): Promise<boolean> {
  return sendEmail({
    to: email,
    subject: "Two-Factor Authentication Enabled",
    text: "Two-factor authentication has been enabled on your HR Portal account.",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f4f4f5; padding: 40px 20px;">
          <div style="max-width: 480px; margin: 0 auto; background: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <h1 style="color: #1e293b; font-size: 24px; margin-bottom: 24px; text-align: center;">
              ✅ 2FA Enabled
            </h1>
            <p style="color: #475569; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
              Two-factor authentication has been successfully enabled on your HR Portal account. Your account is now more secure!
            </p>
            <div style="background: #f0fdf4; border: 1px solid #86efac; border-radius: 8px; padding: 16px; margin: 24px 0;">
              <p style="color: #166534; font-size: 14px; margin: 0;">
                <strong>Important:</strong> Make sure to save your backup codes in a secure location. You'll need them if you lose access to your authenticator app.
              </p>
            </div>
            <p style="color: #94a3b8; font-size: 14px; text-align: center; margin-top: 24px;">
              If you didn't enable 2FA, please contact support immediately.
            </p>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 32px 0;">
            <p style="color: #94a3b8; font-size: 12px; text-align: center;">
              HR Portal • Secure Authentication
            </p>
          </div>
        </body>
      </html>
    `,
  });
}
