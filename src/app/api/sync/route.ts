import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { syncAllTenants, syncTenant, getSyncStatus } from "@/lib/google-sync";

// POST /api/sync - Trigger a new sync run
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRoles = session.user.roles || [];
    if (!userRoles.includes("HR") && !userRoles.includes("ADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check if there's already a running sync
    const runningSync = await db.syncRun.findFirst({
      where: { status: { in: ["PENDING", "RUNNING"] } },
    });

    if (runningSync) {
      return NextResponse.json(
        { error: "A sync is already in progress" },
        { status: 409 }
      );
    }

    // Parse request body for optional tenant ID
    const body = await request.json().catch(() => ({}));
    const { tenantId } = body;

    // Audit log
    await db.auditEvent.create({
      data: {
        actorId: session.user.id,
        actorEmail: session.user.email,
        action: "sync.trigger",
        resourceType: "SyncRun",
        resourceId: tenantId || "all",
        newValues: { trigger: "MANUAL", tenantId },
      },
    });

    // Start async sync (don't await - return immediately)
    if (tenantId) {
      // Sync single tenant
      const tenant = await db.googleWorkspaceTenant.findUnique({
        where: { id: tenantId },
      });

      if (!tenant) {
        return NextResponse.json(
          { error: "Tenant not found" },
          { status: 404 }
        );
      }

      // Start sync in background
      syncTenant(tenant, session.user.id).catch(console.error);

      return NextResponse.json({
        success: true,
        message: `Sync started for ${tenant.name}`,
        tenantId: tenant.id,
      });
    } else {
      // Sync all tenants
      syncAllTenants(session.user.id).catch(console.error);

      return NextResponse.json({
        success: true,
        message: "Sync started for all tenants",
      });
    }
  } catch (error) {
    console.error("Failed to start sync:", error);
    return NextResponse.json(
      { error: "Failed to start sync" },
      { status: 500 }
    );
  }
}

// GET /api/sync - Get current sync status
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRoles = session.user.roles || [];
    if (!userRoles.includes("HR") && !userRoles.includes("ADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const status = await getSyncStatus();

    // Get last completed sync
    const lastSync = await db.syncRun.findFirst({
      where: { status: "COMPLETED" },
      orderBy: { completedAt: "desc" },
      include: {
        triggeredBy: { select: { id: true, fullName: true } },
        tenant: { select: { name: true, domain: true } },
        _count: { select: { errors: true } },
      },
    });

    return NextResponse.json({
      ...status,
      lastSync,
    });
  } catch (error) {
    console.error("Failed to get sync status:", error);
    return NextResponse.json(
      { error: "Failed to get sync status" },
      { status: 500 }
    );
  }
}
