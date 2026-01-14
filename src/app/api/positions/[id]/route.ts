import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// GET /api/positions/[id] - Get single position
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

    const position = await db.position.findUnique({
      where: { id },
      include: {
        department: { select: { id: true, name: true } },
        _count: { select: { employees: true } },
      },
    });

    if (!position) {
      return NextResponse.json(
        { error: "Position not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(position);
  } catch (error) {
    console.error("Failed to fetch position:", error);
    return NextResponse.json(
      { error: "Failed to fetch position" },
      { status: 500 }
    );
  }
}

// PATCH /api/positions/[id] - Update position
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
    const { title, departmentId, isActive } = body;

    const existing = await db.position.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Position not found" },
        { status: 404 }
      );
    }

    // Check for duplicate title in the same department (excluding self)
    if (title) {
      const duplicate = await db.position.findFirst({
        where: {
          title: title.trim(),
          departmentId: departmentId !== undefined ? departmentId : existing.departmentId,
          NOT: { id },
        },
      });

      if (duplicate) {
        return NextResponse.json(
          { error: "Position with this title already exists in this department" },
          { status: 400 }
        );
      }
    }

    const oldValues = {
      title: existing.title,
      departmentId: existing.departmentId,
      isActive: existing.isActive,
    };

    const position = await db.position.update({
      where: { id },
      data: {
        ...(title !== undefined && { title: title.trim() }),
        ...(departmentId !== undefined && { departmentId }),
        ...(isActive !== undefined && { isActive }),
      },
      include: {
        department: { select: { id: true, name: true } },
        _count: { select: { employees: true } },
      },
    });

    // Audit log
    await db.auditEvent.create({
      data: {
        actorId: session.user.id,
        actorEmail: session.user.email,
        action: "position.update",
        resourceType: "Position",
        resourceId: id,
        oldValues,
        newValues: { title, departmentId, isActive },
      },
    });

    return NextResponse.json(position);
  } catch (error) {
    console.error("Failed to update position:", error);
    return NextResponse.json(
      { error: "Failed to update position" },
      { status: 500 }
    );
  }
}

// DELETE /api/positions/[id] - Delete position
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
      return NextResponse.json(
        { error: "Only admins can delete positions" },
        { status: 403 }
      );
    }

    const { id } = await params;

    const position = await db.position.findUnique({
      where: { id },
      include: { _count: { select: { employees: true } } },
    });

    if (!position) {
      return NextResponse.json(
        { error: "Position not found" },
        { status: 404 }
      );
    }

    if (position._count.employees > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete position with ${position._count.employees} employee(s). Please reassign them first.`,
        },
        { status: 400 }
      );
    }

    await db.position.delete({ where: { id } });

    // Audit log
    await db.auditEvent.create({
      data: {
        actorId: session.user.id,
        actorEmail: session.user.email,
        action: "position.delete",
        resourceType: "Position",
        resourceId: id,
        oldValues: {
          title: position.title,
          departmentId: position.departmentId,
          isActive: position.isActive,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete position:", error);
    return NextResponse.json(
      { error: "Failed to delete position" },
      { status: 500 }
    );
  }
}
