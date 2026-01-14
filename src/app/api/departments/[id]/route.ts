import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// GET single department
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const department = await db.department.findUnique({
      where: { id },
      include: {
        parent: { select: { id: true, name: true } },
        children: { select: { id: true, name: true } },
        _count: { select: { employees: true, positions: true } },
      },
    });

    if (!department) {
      return NextResponse.json({ error: "Department not found" }, { status: 404 });
    }

    return NextResponse.json(department);
  } catch (error) {
    console.error("Error fetching department:", error);
    return NextResponse.json({ error: "Failed to fetch department" }, { status: 500 });
  }
}

// PATCH update department
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
    const { name, code, parentId, isActive } = body;

    const existing = await db.department.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Department not found" }, { status: 404 });
    }

    // Check for duplicate name
    if (name && name !== existing.name) {
      const duplicate = await db.department.findUnique({ where: { name } });
      if (duplicate) {
        return NextResponse.json({ error: "Department with this name already exists" }, { status: 400 });
      }
    }

    // Prevent circular parent reference
    if (parentId === id) {
      return NextResponse.json({ error: "Department cannot be its own parent" }, { status: 400 });
    }

    const department = await db.department.update({
      where: { id },
      data: {
        name: name?.trim() || existing.name,
        code: code !== undefined ? (code?.trim() || null) : existing.code,
        parentId: parentId !== undefined ? (parentId || null) : existing.parentId,
        isActive: isActive !== undefined ? isActive : existing.isActive,
      },
    });

    // Audit log
    await db.auditEvent.create({
      data: {
        actorId: session.user.id,
        actorEmail: session.user.email,
        action: "UPDATE",
        resourceType: "DEPARTMENT",
        resourceId: id,
        oldValues: { name: existing.name, code: existing.code, parentId: existing.parentId, isActive: existing.isActive },
        newValues: { name, code, parentId, isActive },
      },
    });

    return NextResponse.json(department);
  } catch (error) {
    console.error("Error updating department:", error);
    return NextResponse.json({ error: "Failed to update department" }, { status: 500 });
  }
}

// DELETE department
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
      return NextResponse.json({ error: "Forbidden: Admin only" }, { status: 403 });
    }

    const { id } = await params;
    
    // Check if department has employees
    const employeeCount = await db.employee.count({ where: { departmentId: id } });
    if (employeeCount > 0) {
      return NextResponse.json({ 
        error: `Cannot delete department with ${employeeCount} employees. Reassign employees first.` 
      }, { status: 400 });
    }

    const department = await db.department.delete({ where: { id } });

    // Audit log
    await db.auditEvent.create({
      data: {
        actorId: session.user.id,
        actorEmail: session.user.email,
        action: "DELETE",
        resourceType: "DEPARTMENT",
        resourceId: id,
        oldValues: { name: department.name },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting department:", error);
    return NextResponse.json({ error: "Failed to delete department" }, { status: 500 });
  }
}
