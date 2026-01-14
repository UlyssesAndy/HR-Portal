import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// GET /api/positions - List all positions
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const departmentId = searchParams.get("departmentId");
    const includeInactive = searchParams.get("includeInactive") === "true";

    const positions = await db.position.findMany({
      where: {
        ...(departmentId && { departmentId }),
        ...(!includeInactive && { isActive: true }),
      },
      include: {
        department: { select: { id: true, name: true } },
        _count: { select: { employees: true } },
      },
      orderBy: [{ department: { name: "asc" } }, { title: "asc" }],
    });

    return NextResponse.json(positions);
  } catch (error) {
    console.error("Failed to fetch positions:", error);
    return NextResponse.json(
      { error: "Failed to fetch positions" },
      { status: 500 }
    );
  }
}

// POST /api/positions - Create new position
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

    const body = await request.json();
    const { title, departmentId, isActive = true } = body;

    if (!title?.trim()) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    // Check for duplicate title in the same department
    const existing = await db.position.findFirst({
      where: {
        title: title.trim(),
        departmentId: departmentId || null,
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Position with this title already exists in this department" },
        { status: 400 }
      );
    }

    const position = await db.position.create({
      data: {
        title: title.trim(),
        departmentId: departmentId || null,
        isActive,
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
        action: "position.create",
        resourceType: "Position",
        resourceId: position.id,
        newValues: { title, departmentId, isActive },
      },
    });

    return NextResponse.json(position, { status: 201 });
  } catch (error) {
    console.error("Failed to create position:", error);
    return NextResponse.json(
      { error: "Failed to create position" },
      { status: 500 }
    );
  }
}
