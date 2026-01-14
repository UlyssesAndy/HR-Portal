import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function POST() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // In a full implementation, we'd mark onboardingComplete = true
  // For now, just return success
  return NextResponse.json({ success: true });
}
