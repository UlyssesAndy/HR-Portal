import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// GET - Fetch page config
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get("page");

    if (!page) {
      return NextResponse.json(
        { error: "Page parameter required" },
        { status: 400 }
      );
    }

    const pageConfig = await db.pageConfig.findUnique({
      where: { page },
    });

    if (!pageConfig) {
      // Return default empty config
      return NextResponse.json({
        page,
        config: {
          sections: [],
        },
        version: 0,
      });
    }

    return NextResponse.json({
      id: pageConfig.id,
      page: pageConfig.page,
      config: pageConfig.config,
      version: pageConfig.version,
    });
  } catch (error) {
    console.error("Page config fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch page config" },
      { status: 500 }
    );
  }
}

// POST - Save page config (Admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRoles = session.user.roles || [];
    if (!userRoles.includes("ADMIN")) {
      return NextResponse.json(
        { error: "Forbidden: Admin role required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { page, config } = body;

    if (!page || !config) {
      return NextResponse.json(
        { error: "Page and config are required" },
        { status: 400 }
      );
    }

    // Get employee ID
    const employee = await db.employee.findUnique({
      where: { email: session.user.email! },
      select: { id: true },
    });

    if (!employee) {
      return NextResponse.json(
        { error: "Employee not found" },
        { status: 404 }
      );
    }

    // Upsert page config
    const pageConfig = await db.pageConfig.upsert({
      where: { page },
      create: {
        page,
        config,
        version: 1,
        updatedBy: employee.id,
      },
      update: {
        config,
        version: { increment: 1 },
        updatedBy: employee.id,
      },
    });

    // Audit log
    await db.auditEvent.create({
      data: {
        actorId: employee.id,
        actorEmail: session.user.email!,
        action: "page_config.update",
        resourceType: "PageConfig",
        resourceId: pageConfig.id,
        metadata: {
          page,
          version: pageConfig.version,
        },
      },
    });

    return NextResponse.json({
      success: true,
      pageConfig: {
        id: pageConfig.id,
        page: pageConfig.page,
        config: pageConfig.config,
        version: pageConfig.version,
      },
    });
  } catch (error) {
    console.error("Page config save error:", error);
    return NextResponse.json(
      { error: "Failed to save page config" },
      { status: 500 }
    );
  }
}
