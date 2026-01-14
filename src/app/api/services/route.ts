import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// GET /api/services - List all services
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get("categoryId");
    const includeInactive = searchParams.get("includeInactive") === "true";

    const services = await db.serviceLink.findMany({
      where: {
        ...(categoryId && { categoryId }),
        ...(!includeInactive && { isActive: true }),
      },
      include: {
        category: { select: { id: true, name: true } },
        visibleRoles: true,
      },
      orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
    });

    return NextResponse.json(services);
  } catch (error) {
    console.error("Failed to fetch services:", error);
    return NextResponse.json(
      { error: "Failed to fetch services" },
      { status: 500 }
    );
  }
}

// POST /api/services - Create new service
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
    const { title, description, url, iconUrl, categoryId, sortOrder, isActive, visibleRoles } = body;

    if (!title?.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    if (!url?.trim()) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    const service = await db.serviceLink.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        url: url.trim(),
        iconUrl: iconUrl?.trim() || null,
        categoryId: categoryId || null,
        sortOrder: sortOrder || 0,
        isActive: isActive !== false,
        ...(visibleRoles?.length > 0 && {
          visibleRoles: {
            create: visibleRoles.map((role: string) => ({ role })),
          },
        }),
      },
      include: {
        category: { select: { id: true, name: true } },
        visibleRoles: true,
      },
    });

    // Audit log
    await db.auditEvent.create({
      data: {
        actorId: session.user.id,
        actorEmail: session.user.email,
        action: "service.create",
        resourceType: "ServiceLink",
        resourceId: service.id,
        newValues: { title, url, categoryId, visibleRoles },
      },
    });

    return NextResponse.json(service, { status: 201 });
  } catch (error) {
    console.error("Failed to create service:", error);
    return NextResponse.json(
      { error: "Failed to create service" },
      { status: 500 }
    );
  }
}
