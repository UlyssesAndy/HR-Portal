import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { z } from "zod";
import { Prisma } from "@prisma/client";

// Schema for creating/updating a saved view
const savedViewSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(255).optional(),
  isShared: z.boolean().optional().default(false),
  isDefault: z.boolean().optional().default(false),
  filters: z.record(z.string(), z.string()).optional().default({}),
  sortBy: z.string().max(50).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
  icon: z.string().max(50).optional(),
  color: z.string().max(20).optional(),
});

// GET - List saved views for current user
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const views = await db.savedView.findMany({
      where: {
        OR: [
          { userId: session.user.id },
          { isShared: true },
        ],
      },
      orderBy: [
        { isDefault: "desc" },
        { usageCount: "desc" },
        { name: "asc" },
      ],
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

    return NextResponse.json({ views });
  } catch (error) {
    console.error("Error fetching saved views:", error);
    return NextResponse.json(
      { error: "Failed to fetch saved views" },
      { status: 500 }
    );
  }
}

// POST - Create a new saved view
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const data = savedViewSchema.parse(body);

    // If setting as default, unset other defaults for this user
    if (data.isDefault) {
      await db.savedView.updateMany({
        where: { userId: session.user.id, isDefault: true },
        data: { isDefault: false },
      });
    }

    const view = await db.savedView.create({
      data: {
        name: data.name,
        description: data.description,
        isShared: data.isShared,
        isDefault: data.isDefault,
        filters: data.filters as Prisma.InputJsonValue,
        sortBy: data.sortBy,
        sortOrder: data.sortOrder,
        icon: data.icon,
        color: data.color,
        userId: session.user.id,
      },
    });

    return NextResponse.json({ view }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Error creating saved view:", error);
    return NextResponse.json(
      { error: "Failed to create saved view" },
      { status: 500 }
    );
  }
}
