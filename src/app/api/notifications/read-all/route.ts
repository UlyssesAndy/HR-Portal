import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// Mark all notifications as read for current user
export async function POST() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Get recent audit events (same as in GET notifications)
    const events = await db.auditEvent.findMany({
      where: {
        action: {
          in: [
            "employee.create",
            "employee.update", 
            "role.assign",
            "role.revoke",
            "csv.import",
            "sync.complete",
            "BULK_UPDATE",
            "UPDATE_CONFIG",
          ],
        },
      },
      select: { id: true },
      take: 50, // Recent 50 events
    });

    // Create read records for all (skip existing via upsert)
    const operations = events.map(event =>
      db.notificationRead.upsert({
        where: {
          userId_eventId: { userId, eventId: event.id },
        },
        update: {},
        create: {
          userId,
          eventId: event.id,
        },
      })
    );

    await db.$transaction(operations);

    return NextResponse.json({ success: true, count: events.length });
  } catch (error) {
    console.error("Mark all read error:", error);
    return NextResponse.json(
      { error: "Failed to mark all as read" },
      { status: 500 }
    );
  }
}
