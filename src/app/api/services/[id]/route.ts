import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// GET /api/services/[id] - Get single service
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

    const service = await db.serviceLink.findUnique({
      where: { id },
      include: {
        category: { select: { id: true, name: true } },
        visibleRoles: true,
      },
    });

    if (!service) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    return NextResponse.json(service);
  } catch (error) {
    console.error("Failed to fetch service:", error);
    return NextResponse.json(
      { error: "Failed to fetch service" },
      { status: 500 }
    );
  }
}

// PATCH /api/services/[id] - Update service
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
    const { title, description, url, iconUrl, categoryId, sortOrder, isActive, visibleRoles } = body;

    const existing = await db.serviceLink.findUnique({
      where: { id },
      include: { visibleRoles: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    const oldValues = {
      title: existing.title,
      url: existing.url,
      categoryId: existing.categoryId,
      isActive: existing.isActive,
      visibleRoles: existing.visibleRoles.map(r => r.role),
    };

    // Update with role management
    const service = await db.$transaction(async (tx) => {
      // Delete existing roles if new roles provided
      if (visibleRoles !== undefined) {
        await tx.serviceLinkRole.deleteMany({
          where: { serviceLinkId: id },
        });
      }

      return tx.serviceLink.update({
        where: { id },
        data: {
          ...(title !== undefined && { title: title.trim() }),
          ...(description !== undefined && { description: description?.trim() || null }),
          ...(url !== undefined && { url: url.trim() }),
          ...(iconUrl !== undefined && { iconUrl: iconUrl?.trim() || null }),
          ...(categoryId !== undefined && { categoryId: categoryId || null }),
          ...(sortOrder !== undefined && { sortOrder }),
          ...(isActive !== undefined && { isActive }),
          ...(visibleRoles !== undefined && visibleRoles.length > 0 && {
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
    });

    // Audit log
    await db.auditEvent.create({
      data: {
        actorId: session.user.id,
        actorEmail: session.user.email,
        action: "service.update",
        resourceType: "ServiceLink",
        resourceId: id,
        oldValues,
        newValues: { title, url, categoryId, visibleRoles, isActive },
      },
    });

    return NextResponse.json(service);
  } catch (error) {
    console.error("Failed to update service:", error);
    return NextResponse.json(
      { error: "Failed to update service" },
      { status: 500 }
    );
  }
}

// DELETE /api/services/[id] - Delete service
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
        { error: "Only admins can delete services" },
        { status: 403 }
      );
    }

    const { id } = await params;

    const service = await db.serviceLink.findUnique({
      where: { id },
    });

    if (!service) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    await db.serviceLink.delete({ where: { id } });

    // Audit log
    await db.auditEvent.create({
      data: {
        actorId: session.user.id,
        actorEmail: session.user.email,
        action: "service.delete",
        resourceType: "ServiceLink",
        resourceId: id,
        oldValues: { title: service.title, url: service.url },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete service:", error);
    return NextResponse.json(
      { error: "Failed to delete service" },
      { status: 500 }
    );
  }
}
