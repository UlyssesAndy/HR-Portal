import crypto from "crypto";

const MAGIC_LINK_EXPIRY_MINUTES = 15;

export function generateMagicLinkToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function getMagicLinkExpiry(): Date {
  return new Date(Date.now() + MAGIC_LINK_EXPIRY_MINUTES * 60 * 1000);
}

export function isMagicLinkExpired(expiresAt: Date): boolean {
  return new Date() > expiresAt;
}

export function generateMagicLinkUrl(token: string, baseUrl: string): string {
  return `${baseUrl}/auth/verify-magic-link?token=${token}`;
}
