import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// Activity feed - recent events in the system
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "20");
    const cursor = searchParams.get("cursor");

    // Build query
    const where: any = {};
    
    // Filter by relevant actions for activity feed
    where.action = {
      in: [
        "auth.login",
        "employee.update",
        "employee.create",
        "role.assign",
        "role.revoke",
        "csv.import",
        "sync.complete",
        "department.create",
        "department.update",
        "position.create",
        "position.update",
        "BULK_UPDATE",
        "UPDATE_CONFIG",
      ],
    };

    if (cursor) {
      where.createdAt = { lt: new Date(cursor) };
    }

    const events = await db.auditEvent.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit + 1,
      include: {
        actor: {
          select: { id: true, fullName: true, avatarUrl: true },
        },
      },
    });

    const hasMore = events.length > limit;
    const items = hasMore ? events.slice(0, limit) : events;
    const nextCursor = hasMore ? items[items.length - 1].createdAt.toISOString() : null;

    // Transform events into activity feed items
    const activities = items.map((event) => ({
      id: event.id,
      action: event.action,
      resourceType: event.resourceType,
      resourceId: event.resourceId,
      actor: event.actor
        ? {
            id: event.actor.id,
            name: event.actor.fullName,
            avatarUrl: event.actor.avatarUrl,
          }
        : {
            id: null,
            name: event.actorEmail || "System",
            avatarUrl: null,
          },
      metadata: event.metadata as Record<string, any> | null,
      timestamp: event.createdAt.toISOString(),
      description: formatActivityDescription(event),
    }));

    return NextResponse.json({
      activities,
      nextCursor,
      hasMore,
    });
  } catch (error) {
    console.error("Activity feed error:", error);
    return NextResponse.json({ error: "Failed to fetch activity" }, { status: 500 });
  }
}

function formatActivityDescription(event: any): string {
  const actorName = event.actor?.fullName || event.actorEmail || "System";
  
  switch (event.action) {
    case "auth.login":
      return `${actorName} logged in`;
    case "employee.create":
      return `${actorName} created a new employee`;
    case "employee.update":
      return `${actorName} updated employee profile`;
    case "role.assign":
      return `${actorName} assigned a role`;
    case "role.revoke":
      return `${actorName} revoked a role`;
    case "csv.import":
      return `${actorName} imported CSV data`;
    case "sync.complete":
      return "Google sync completed";
    case "department.create":
      return `${actorName} created a department`;
    case "department.update":
      return `${actorName} updated a department`;
    case "position.create":
      return `${actorName} created a position`;
    case "position.update":
      return `${actorName} updated a position`;
    case "BULK_UPDATE":
      const count = event.metadata?.employeeCount || "multiple";
      return `${actorName} bulk updated ${count} employees`;
    case "UPDATE_CONFIG":
      return `${actorName} updated system configuration`;
    default:
      return `${actorName} performed ${event.action}`;
  }
}
