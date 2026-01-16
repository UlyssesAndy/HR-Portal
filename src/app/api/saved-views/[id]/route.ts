import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { z } from "zod";
import { Prisma } from "@prisma/client";

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(255).optional().nullable(),
  isShared: z.boolean().optional(),
  isDefault: z.boolean().optional(),
  filters: z.record(z.string(), z.string()).optional(),
  sortBy: z.string().max(50).optional().nullable(),
  sortOrder: z.enum(["asc", "desc"]).optional().nullable(),
  icon: z.string().max(50).optional().nullable(),
  color: z.string().max(20).optional().nullable(),
});

// GET - Get single saved view
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const view = await db.savedView.findFirst({
      where: {
        id,
        OR: [
          { userId: session.user.id },
          { isShared: true },
        ],
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
          },
        },
      },
    });

    if (!view) {
      return NextResponse.json({ error: "View not found" }, { status: 404 });
    }

    return NextResponse.json({ view });
  } catch (error) {
    console.error("Error fetching saved view:", error);
    return NextResponse.json(
      { error: "Failed to fetch saved view" },
      { status: 500 }
    );
  }
}

// PATCH - Update a saved view
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const data = updateSchema.parse(body);

    // Check ownership
    const existing = await db.savedView.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "View not found" }, { status: 404 });
    }
    if (existing.userId !== session.user.id) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    // If setting as default, unset other defaults
    if (data.isDefault) {
      await db.savedView.updateMany({
        where: { userId: session.user.id, isDefault: true, id: { not: id } },
        data: { isDefault: false },
      });
    }

    const view = await db.savedView.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.isShared !== undefined && { isShared: data.isShared }),
        ...(data.isDefault !== undefined && { isDefault: data.isDefault }),
        ...(data.filters !== undefined && { filters: data.filters as Prisma.InputJsonValue }),
        ...(data.sortBy !== undefined && { sortBy: data.sortBy }),
        ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
        ...(data.icon !== undefined && { icon: data.icon }),
        ...(data.color !== undefined && { color: data.color }),
      },
    });

    return NextResponse.json({ view });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Error updating saved view:", error);
    return NextResponse.json(
      { error: "Failed to update saved view" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a saved view
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Check ownership
    const existing = await db.savedView.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "View not found" }, { status: 404 });
    }
    if (existing.userId !== session.user.id) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    await db.savedView.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting saved view:", error);
    return NextResponse.json(
      { error: "Failed to delete saved view" },
      { status: 500 }
    );
  }
}
