"use server";

import { signIn } from "@/lib/auth";
import { AuthError } from "next-auth";

export async function loginWithEmail(email: string) {
  try {
    await signIn("email-login", {
      email: email.trim().toLowerCase(),
      redirect: false,
    });
    return { success: true };
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Invalid credentials or domain not allowed" };
        case "AccessDenied":
          return { error: "Access denied. Your email domain is not allowed." };
        default:
          return { error: error.message || "Authentication failed" };
      }
    }
    // Re-throw redirect errors (these are expected for successful auth)
    if (error instanceof Error && error.message.includes("NEXT_REDIRECT")) {
      throw error;
    }
    return { error: "An unexpected error occurred" };
  }
}
