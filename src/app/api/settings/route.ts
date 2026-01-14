import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// GET /api/settings - List all settings or by category
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
    const category = searchParams.get("category");

    const settings = await db.integrationSetting.findMany({
      where: category ? { category } : undefined,
      orderBy: [{ category: "asc" }, { key: "asc" }],
    });

    // Mask secret values
    const sanitized = settings.map((s) => ({
      ...s,
      value: s.isSecret && s.value ? "[CONFIGURED]" : s.value,
    }));

    return NextResponse.json(sanitized);
  } catch (error) {
    console.error("Failed to fetch settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

// POST /api/settings - Create or update setting
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
    const { category, key, value, isSecret, description } = body;

    if (!category?.trim() || !key?.trim()) {
      return NextResponse.json(
        { error: "Category and key are required" },
        { status: 400 }
      );
    }

    const setting = await db.integrationSetting.upsert({
      where: {
        category_key: {
          category: category.trim(),
          key: key.trim(),
        },
      },
      create: {
        category: category.trim(),
        key: key.trim(),
        value: value ?? null,
        isSecret: isSecret ?? false,
        description: description?.trim() ?? null,
      },
      update: {
        value: value ?? null,
        isSecret: isSecret ?? false,
        description: description?.trim() ?? null,
      },
    });

    // Audit log
    await db.auditEvent.create({
      data: {
        actorId: session.user.id,
        actorEmail: session.user.email,
        action: "setting.update",
        resourceType: "IntegrationSetting",
        resourceId: setting.id,
        newValues: { category, key, isSecret },
      },
    });

    return NextResponse.json({
      ...setting,
      value: setting.isSecret && setting.value ? "[CONFIGURED]" : setting.value,
    });
  } catch (error) {
    console.error("Failed to save setting:", error);
    return NextResponse.json(
      { error: "Failed to save setting" },
      { status: 500 }
    );
  }
}

// PUT /api/settings - Bulk update settings
export async function PUT(request: NextRequest) {
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
    const { settings } = body as { settings: Array<{ category: string; key: string; value?: string; isSecret?: boolean; description?: string }> };

    if (!Array.isArray(settings)) {
      return NextResponse.json(
        { error: "Settings array is required" },
        { status: 400 }
      );
    }

    const results = await Promise.all(
      settings.map(async ({ category, key, value, isSecret, description }) => {
        if (!category?.trim() || !key?.trim()) return null;
        
        return db.integrationSetting.upsert({
          where: {
            category_key: {
              category: category.trim(),
              key: key.trim(),
            },
          },
          create: {
            category: category.trim(),
            key: key.trim(),
            value: value ?? null,
            isSecret: isSecret ?? false,
            description: description?.trim() ?? null,
          },
          update: {
            value: value ?? null,
            isSecret: isSecret ?? false,
            description: description?.trim() ?? null,
          },
        });
      })
    );

    // Audit log
    await db.auditEvent.create({
      data: {
        actorId: session.user.id,
        actorEmail: session.user.email,
        action: "setting.bulk_update",
        resourceType: "IntegrationSetting",
        newValues: { count: results.filter(Boolean).length },
      },
    });

    return NextResponse.json({ 
      success: true, 
      updated: results.filter(Boolean).length 
    });
  } catch (error) {
    console.error("Failed to bulk update settings:", error);
    return NextResponse.json(
      { error: "Failed to bulk update settings" },
      { status: 500 }
    );
  }
}

// DELETE /api/settings - Delete a setting
export async function DELETE(request: NextRequest) {
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
    const category = searchParams.get("category");
    const key = searchParams.get("key");

    if (!category || !key) {
      return NextResponse.json(
        { error: "Category and key are required" },
        { status: 400 }
      );
    }

    const setting = await db.integrationSetting.delete({
      where: {
        category_key: { category, key },
      },
    });

    // Audit log
    await db.auditEvent.create({
      data: {
        actorId: session.user.id,
        actorEmail: session.user.email,
        action: "setting.delete",
        resourceType: "IntegrationSetting",
        resourceId: setting.id,
        oldValues: { category, key },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete setting:", error);
    return NextResponse.json(
      { error: "Failed to delete setting" },
      { status: 500 }
    );
  }
}
