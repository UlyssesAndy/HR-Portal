import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// DELETE /api/roles/[id] - Remove role assignment
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

    const assignment = await db.roleAssignment.findUnique({
      where: { id },
      include: {
        employee: { select: { id: true, fullName: true, email: true } },
      },
    });

    if (!assignment) {
      return NextResponse.json(
        { error: "Role assignment not found" },
        { status: 404 }
      );
    }

    // Prevent removing your own ADMIN role
    if (
      assignment.employeeId === session.user.id &&
      assignment.role === "ADMIN"
    ) {
      return NextResponse.json(
        { error: "You cannot remove your own ADMIN role" },
        { status: 400 }
      );
    }

    await db.roleAssignment.delete({ where: { id } });

    // Audit log
    await db.auditEvent.create({
      data: {
        actorId: session.user.id,
        actorEmail: session.user.email,
        action: "role.revoke",
        resourceType: "RoleAssignment",
        resourceId: id,
        oldValues: {
          employeeId: assignment.employeeId,
          employeeName: assignment.employee.fullName,
          role: assignment.role,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to revoke role:", error);
    return NextResponse.json(
      { error: "Failed to revoke role" },
      { status: 500 }
    );
  }
}
