import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// GET - Fetch active theme config
export async function GET() {
  try {
    const activeTheme = await db.themeConfig.findFirst({
      where: { isActive: true },
    });

    // If no active theme, return default
    if (!activeTheme) {
      return NextResponse.json({
        colors: {
          primary: "#4F46E5",
          secondary: "#10B981",
          accent: "#F59E0B",
          background: "#FFFFFF",
          text: "#1E293B",
        },
        spacing: {
          cardGap: "24px",
          sectionPadding: "32px",
        },
        typography: {
          headingFont: "Inter",
          bodyFont: "Inter",
        },
        borderRadius: {
          card: "12px",
          button: "8px",
          input: "8px",
        },
      });
    }

    return NextResponse.json({
      id: activeTheme.id,
      name: activeTheme.name,
      colors: activeTheme.colors,
      spacing: activeTheme.spacing,
      typography: activeTheme.typography,
      borderRadius: activeTheme.borderRadius,
    });
  } catch (error) {
    console.error("Theme config fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch theme config" },
      { status: 500 }
    );
  }
}

// POST - Save theme config (Admin only)
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
    const { name = "custom", colors, spacing, typography, borderRadius } = body;

    // Deactivate all existing themes
    await db.themeConfig.updateMany({
      where: { isActive: true },
      data: { isActive: false },
    });

    // Get employee ID for updatedBy
    const employee = await db.employee.findUnique({
      where: { email: session.user.email! },
      select: { id: true },
    });

    // Create or update theme
    const theme = await db.themeConfig.upsert({
      where: { name },
      create: {
        name,
        isActive: true,
        colors: colors || {},
        spacing: spacing || {},
        typography: typography || {},
        borderRadius: borderRadius || {},
        updatedBy: employee?.id,
      },
      update: {
        isActive: true,
        colors: colors || {},
        spacing: spacing || {},
        typography: typography || {},
        borderRadius: borderRadius || {},
        updatedBy: employee?.id,
      },
    });

    // Build CSS variables
    const cssVars: Record<string, string> = {};
    
    if (colors) {
      Object.entries(colors).forEach(([key, value]) => {
        cssVars[`--color-${key}`] = value as string;
      });
    }
    
    if (spacing) {
      Object.entries(spacing).forEach(([key, value]) => {
        cssVars[`--spacing-${key}`] = value as string;
      });
    }
    
    if (borderRadius) {
      Object.entries(borderRadius).forEach(([key, value]) => {
        cssVars[`--radius-${key}`] = value as string;
      });
    }

    // Update CSS vars
    await db.themeConfig.update({
      where: { id: theme.id },
      data: { cssVars },
    });

    // Audit log
    await db.auditEvent.create({
      data: {
        actorId: employee!.id,
        actorEmail: session.user.email!,
        action: "theme.update",
        resourceType: "ThemeConfig",
        resourceId: theme.id,
        metadata: { name, themeId: theme.id },
      },
    });

    return NextResponse.json({
      success: true,
      theme: {
        id: theme.id,
        name: theme.name,
        colors,
        spacing,
        typography,
        borderRadius,
      },
    });
  } catch (error) {
    console.error("Theme config save error:", error);
    return NextResponse.json(
      { error: "Failed to save theme config" },
      { status: 500 }
    );
  }
}
