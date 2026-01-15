import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

// Transform audit events to notifications
function formatNotification(event: any, isRead: boolean) {
  const titles: Record<string, string> = {
    "auth.login": "User Login",
    "employee.create": "New Employee",
    "employee.update": "Profile Updated",
    "role.assign": "Role Assigned",
    "role.revoke": "Role Revoked",
    "csv.import": "CSV Import",
    "sync.complete": "Sync Complete",
    "BULK_UPDATE": "Bulk Update",
    "UPDATE_CONFIG": "Config Updated",
  };

  return {
    id: event.id,
    type: event.action,
    title: titles[event.action] || event.action,
    message: event.details?.description || event.details?.message || `Action: ${event.action}`,
    createdAt: event.createdAt.toISOString(),
    read: isRead,
  };
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    // Detailed logging for debugging
    console.log("[Notifications API] Session check:", {
      hasSession: !!session,
      hasUser: !!session?.user,
      userId: session?.user?.id,
      userEmail: session?.user?.email,
    });
    
    if (!session?.user) {
      console.error("[Notifications API] No session or user found");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "10");

    // Get recent audit events as notifications
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
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    // Get read status for this user
    const readNotifications = await db.notificationRead.findMany({
      where: {
        userId,
        eventId: { in: events.map(e => e.id) },
      },
      select: { eventId: true },
    });

    const readEventIds = new Set(readNotifications.map(r => r.eventId));

    const notifications = events.map(event => 
      formatNotification(event, readEventIds.has(event.id))
    );

    // Count unread
    const unreadCount = notifications.filter(n => !n.read).length;

    return NextResponse.json({
      notifications,
      unreadCount,
      total: notifications.length,
    });
  } catch (error) {
    console.error("Get notifications error:", error);
    return NextResponse.json(
      { error: "Failed to get notifications" },
      { status: 500 }
    );
  }
}
