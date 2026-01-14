import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// GET /api/legal-entities - List all legal entities
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const includeInactive = searchParams.get("includeInactive") === "true";

  try {
    const legalEntities = await db.legalEntity.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { employees: true },
        },
      },
    });

    return NextResponse.json({ data: legalEntities });
  } catch (error) {
    console.error("Error fetching legal entities:", error);
    return NextResponse.json(
      { error: "Failed to fetch legal entities" },
      { status: 500 }
    );
  }
}

// POST /api/legal-entities - Create new legal entity
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userRoles = session.user.roles || [];
  if (!userRoles.includes("HR") && !userRoles.includes("ADMIN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { name, shortName, inn, isActive = true } = body;

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    // Check for duplicate name
    const existing = await db.legalEntity.findUnique({
      where: { name: name.trim() },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Legal entity with this name already exists" },
        { status: 409 }
      );
    }

    // Check for duplicate INN if provided
    if (inn) {
      const existingInn = await db.legalEntity.findUnique({
        where: { inn: inn.trim() },
      });

      if (existingInn) {
        return NextResponse.json(
          { error: "Legal entity with this INN already exists" },
          { status: 409 }
        );
      }
    }

    const legalEntity = await db.legalEntity.create({
      data: {
        name: name.trim(),
        shortName: shortName?.trim() || null,
        inn: inn?.trim() || null,
        isActive,
      },
    });

    // Audit log
    await db.auditEvent.create({
      data: {
        actorId: session.user.id,
        actorEmail: session.user.email,
        action: "legal_entity.create",
        resourceType: "legal_entity",
        resourceId: legalEntity.id,
        newValues: { name, shortName, inn, isActive },
      },
    });

    return NextResponse.json({ data: legalEntity }, { status: 201 });
  } catch (error) {
    console.error("Error creating legal entity:", error);
    return NextResponse.json(
      { error: "Failed to create legal entity" },
      { status: 500 }
    );
  }
}
