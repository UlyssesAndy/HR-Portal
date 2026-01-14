import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// GET /api/roles - Get all role assignments with employees
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRoles = session.user.roles || [];
    if (!userRoles.includes("ADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role");
    const employeeId = searchParams.get("employeeId");

    const assignments = await db.roleAssignment.findMany({
      where: {
        ...(role && { role: role as any }),
        ...(employeeId && { employeeId }),
      },
      include: {
        employee: {
          select: {
            id: true,
            fullName: true,
            email: true,
            avatarUrl: true,
            status: true,
          },
        },
        grantedBy: {
          select: { id: true, fullName: true },
        },
      },
      orderBy: [{ role: "asc" }, { employee: { fullName: "asc" } }],
    });

    return NextResponse.json(assignments);
  } catch (error) {
    console.error("Failed to fetch role assignments:", error);
    return NextResponse.json(
      { error: "Failed to fetch role assignments" },
      { status: 500 }
    );
  }
}

// POST /api/roles - Assign role to employee
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRoles = session.user.roles || [];
    if (!userRoles.includes("ADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { employeeId, role, expiresAt } = body;

    if (!employeeId || !role) {
      return NextResponse.json(
        { error: "Employee ID and role are required" },
        { status: 400 }
      );
    }

    // Check if employee exists
    const employee = await db.employee.findUnique({ where: { id: employeeId } });
    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    // Check if assignment already exists
    const existing = await db.roleAssignment.findUnique({
      where: { employeeId_role: { employeeId, role } },
    });

    if (existing) {
      return NextResponse.json(
        { error: "This role is already assigned to this employee" },
        { status: 400 }
      );
    }

    const assignment = await db.roleAssignment.create({
      data: {
        employeeId,
        role,
        isManualOverride: true,
        grantedById: session.user.id,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
      include: {
        employee: {
          select: {
            id: true,
            fullName: true,
            email: true,
            avatarUrl: true,
            status: true,
          },
        },
        grantedBy: {
          select: { id: true, fullName: true },
        },
      },
    });

    // Audit log
    await db.auditEvent.create({
      data: {
        actorId: session.user.id,
        actorEmail: session.user.email,
        action: "role.assign",
        resourceType: "RoleAssignment",
        resourceId: assignment.id,
        newValues: { employeeId, role, employeeName: employee.fullName },
      },
    });

    return NextResponse.json(assignment, { status: 201 });
  } catch (error) {
    console.error("Failed to assign role:", error);
    return NextResponse.json(
      { error: "Failed to assign role" },
      { status: 500 }
    );
  }
}
