import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/legal-entities/[id] - Get single legal entity
export async function GET(request: NextRequest, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const legalEntity = await db.legalEntity.findUnique({
      where: { id },
      include: {
        _count: {
          select: { employees: true },
        },
      },
    });

    if (!legalEntity) {
      return NextResponse.json(
        { error: "Legal entity not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: legalEntity });
  } catch (error) {
    console.error("Error fetching legal entity:", error);
    return NextResponse.json(
      { error: "Failed to fetch legal entity" },
      { status: 500 }
    );
  }
}

// PATCH /api/legal-entities/[id] - Update legal entity
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userRoles = session.user.roles || [];
  if (!userRoles.includes("HR") && !userRoles.includes("ADMIN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const existing = await db.legalEntity.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Legal entity not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { name, shortName, inn, isActive } = body;

    // Check for duplicate name if changing
    if (name && name !== existing.name) {
      const duplicate = await db.legalEntity.findUnique({
        where: { name: name.trim() },
      });
      if (duplicate) {
        return NextResponse.json(
          { error: "Legal entity with this name already exists" },
          { status: 409 }
        );
      }
    }

    // Check for duplicate INN if changing
    if (inn && inn !== existing.inn) {
      const duplicateInn = await db.legalEntity.findUnique({
        where: { inn: inn.trim() },
      });
      if (duplicateInn) {
        return NextResponse.json(
          { error: "Legal entity with this INN already exists" },
          { status: 409 }
        );
      }
    }

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name.trim();
    if (shortName !== undefined) updateData.shortName = shortName?.trim() || null;
    if (inn !== undefined) updateData.inn = inn?.trim() || null;
    if (isActive !== undefined) updateData.isActive = isActive;

    const legalEntity = await db.legalEntity.update({
      where: { id },
      data: updateData,
    });

    // Audit log
    await db.auditEvent.create({
      data: {
        actorId: session.user.id,
        actorEmail: session.user.email,
        action: "legal_entity.update",
        resourceType: "legal_entity",
        resourceId: id,
        oldValues: {
          name: existing.name,
          shortName: existing.shortName,
          inn: existing.inn,
          isActive: existing.isActive,
        },
        newValues: updateData as Record<string, string | boolean | null>,
      },
    });

    return NextResponse.json({ data: legalEntity });
  } catch (error) {
    console.error("Error updating legal entity:", error);
    return NextResponse.json(
      { error: "Failed to update legal entity" },
      { status: 500 }
    );
  }
}

// DELETE /api/legal-entities/[id] - Delete legal entity
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userRoles = session.user.roles || [];
  if (!userRoles.includes("ADMIN")) {
    return NextResponse.json(
      { error: "Only admins can delete legal entities" },
      { status: 403 }
    );
  }

  const { id } = await params;

  try {
    const existing = await db.legalEntity.findUnique({
      where: { id },
      include: {
        _count: {
          select: { employees: true },
        },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Legal entity not found" },
        { status: 404 }
      );
    }

    if (existing._count.employees > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete: ${existing._count.employees} employees are assigned to this legal entity`,
        },
        { status: 409 }
      );
    }

    await db.legalEntity.delete({
      where: { id },
    });

    // Audit log
    await db.auditEvent.create({
      data: {
        actorId: session.user.id,
        actorEmail: session.user.email,
        action: "legal_entity.delete",
        resourceType: "legal_entity",
        resourceId: id,
        oldValues: {
          name: existing.name,
          shortName: existing.shortName,
          inn: existing.inn,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting legal entity:", error);
    return NextResponse.json(
      { error: "Failed to delete legal entity" },
      { status: 500 }
    );
  }
}
