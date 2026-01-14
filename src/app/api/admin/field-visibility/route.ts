import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// Field visibility configuration using FieldVisibilityConfig model

const ALL_FIELDS = [
  // Directory fields
  { context: "directory", fieldName: "email", label: "Email" },
  { context: "directory", fieldName: "phone", label: "Phone" },
  { context: "directory", fieldName: "department", label: "Department" },
  { context: "directory", fieldName: "position", label: "Position" },
  { context: "directory", fieldName: "manager", label: "Manager" },
  { context: "directory", fieldName: "location", label: "Location" },
  // Profile fields
  { context: "profile", fieldName: "email", label: "Email" },
  { context: "profile", fieldName: "phone", label: "Phone" },
  { context: "profile", fieldName: "birthDate", label: "Birth Date" },
  { context: "profile", fieldName: "startDate", label: "Start Date" },
  { context: "profile", fieldName: "legalEntity", label: "Legal Entity" },
  { context: "profile", fieldName: "employmentType", label: "Employment Type" },
  { context: "profile", fieldName: "timezone", label: "Timezone" },
  { context: "profile", fieldName: "messengerHandle", label: "Messenger Handle" },
];

const ROLES = ["EMPLOYEE", "MANAGER", "HR", "PAYROLL_FINANCE", "ADMIN"] as const;

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only ADMIN can manage field visibility
    const userRoles = session.user.roles || [];
    const isAdmin = userRoles.includes("ADMIN");

    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden: Admin role required" }, { status: 403 });
    }

    // Get existing configs
    const configs = await (db as any).fieldVisibilityConfig.findMany();

    // Build config map
    const configMap: Record<string, boolean> = {};
    for (const config of configs) {
      configMap[`${config.fieldName}_${config.role}`] = config.isVisible;
    }

    // Build response with defaults
    const result: Record<string, Record<string, Record<string, boolean>>> = {
      directory: {},
      profile: {},
    };

    for (const field of ALL_FIELDS) {
      if (!result[field.context][field.fieldName]) {
        result[field.context][field.fieldName] = {};
      }
      for (const role of ROLES) {
        const key = `${field.context}_${field.fieldName}_${role}`;
        // Default: visible for all roles
        result[field.context][field.fieldName][role] = configMap[key] ?? true;
      }
    }

    return NextResponse.json({ config: result, fields: ALL_FIELDS, roles: ROLES });
  } catch (error) {
    console.error("Field visibility GET error:", error);
    return NextResponse.json({ error: "Failed to get config" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRoles = session.user.roles || [];
    const isAdmin = userRoles.includes("ADMIN");

    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden: Admin role required" }, { status: 403 });
    }

    const body = await request.json();
    const { config } = body;

    if (!config) {
      return NextResponse.json({ error: "No config provided" }, { status: 400 });
    }

    // Update or create each config entry
    const operations = [];
    for (const [context, fields] of Object.entries(config)) {
      for (const [fieldName, roles] of Object.entries(fields as Record<string, Record<string, boolean>>)) {
        for (const [role, isVisible] of Object.entries(roles)) {
          const key = `${context}_${fieldName}`;
          operations.push(
            (db as any).fieldVisibilityConfig.upsert({
              where: { fieldName_role: { fieldName: key, role } },
              update: { isVisible },
              create: { fieldName: key, role, isVisible },
            })
          );
        }
      }
    }

    await Promise.all(operations);

    // Audit log
    const currentUserEmployee = await db.employee.findFirst({
      where: { email: session.user.email! },
    });

    await db.auditEvent.create({
      data: {
        actorId: currentUserEmployee?.id || null,
        actorEmail: session.user.email,
        action: "UPDATE_CONFIG",
        resourceType: "FIELD_VISIBILITY",
        resourceId: "global",
        metadata: { updatedAt: new Date().toISOString() },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Field visibility PUT error:", error);
    return NextResponse.json({ error: "Failed to save config" }, { status: 500 });
  }
}
