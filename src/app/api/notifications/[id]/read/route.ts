import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// Mark single notification as read
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: eventId } = await params;
    const userId = session.user.id;

    // Create read record (upsert to handle duplicates)
    await db.notificationRead.upsert({
      where: {
        userId_eventId: { userId, eventId },
      },
      update: {}, // Already marked as read, no update needed
      create: {
        userId,
        eventId,
      },
    });

    return NextResponse.json({ success: true, id: eventId });
  } catch (error) {
    console.error("Mark as read error:", error);
    return NextResponse.json(
      { error: "Failed to mark as read" },
      { status: 500 }
    );
  }
}
