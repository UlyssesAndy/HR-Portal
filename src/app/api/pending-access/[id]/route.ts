import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// PATCH /api/pending-access/[id] - Approve or reject
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRoles = session.user.roles || [];
    if (!userRoles.includes("HR") && !userRoles.includes("ADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { action, reviewNote } = body; // action: 'approve' | 'reject'

    const pendingAccess = await db.pendingAccess.findUnique({ where: { id } });

    if (!pendingAccess) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (pendingAccess.status !== "PENDING") {
      return NextResponse.json(
        { error: "This request has already been processed" },
        { status: 400 }
      );
    }

    if (action === "approve") {
      // Create employee
      const employee = await db.employee.create({
        data: {
          email: pendingAccess.email,
          fullName: pendingAccess.fullName || pendingAccess.email.split("@")[0],
          status: "PENDING",
          isExternal: true,
        },
      });

      // Update pending access
      await db.pendingAccess.update({
        where: { id },
        data: {
          status: "APPROVED",
          reviewedById: session.user.id,
          reviewedAt: new Date(),
          reviewNote,
          employeeId: employee.id,
        },
      });

      // Audit log
      await db.auditEvent.create({
        data: {
          actorId: session.user.id,
          actorEmail: session.user.email,
          action: "pending_access.approve",
          resourceType: "PendingAccess",
          resourceId: id,
          newValues: { employeeId: employee.id, email: pendingAccess.email },
        },
      });

      return NextResponse.json({ success: true, action: "approved", employeeId: employee.id });
    } else if (action === "reject") {
      await db.pendingAccess.update({
        where: { id },
        data: {
          status: "REJECTED",
          reviewedById: session.user.id,
          reviewedAt: new Date(),
          reviewNote,
        },
      });

      await db.auditEvent.create({
        data: {
          actorId: session.user.id,
          actorEmail: session.user.email,
          action: "pending_access.reject",
          resourceType: "PendingAccess",
          resourceId: id,
          oldValues: { email: pendingAccess.email },
        },
      });

      return NextResponse.json({ success: true, action: "rejected" });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Failed to process pending access:", error);
    return NextResponse.json(
      { error: "Failed to process pending access" },
      { status: 500 }
    );
  }
}

// DELETE /api/pending-access/[id] - Delete pending access
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRoles = session.user.roles || [];
    if (!userRoles.includes("ADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    const pendingAccess = await db.pendingAccess.findUnique({ where: { id } });
    if (!pendingAccess) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await db.pendingAccess.delete({ where: { id } });

    await db.auditEvent.create({
      data: {
        actorId: session.user.id,
        actorEmail: session.user.email,
        action: "pending_access.delete",
        resourceType: "PendingAccess",
        resourceId: id,
        oldValues: { email: pendingAccess.email },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete pending access:", error);
    return NextResponse.json(
      { error: "Failed to delete pending access" },
      { status: 500 }
    );
  }
}
