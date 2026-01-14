import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only HR and ADMIN can bulk update
    const userRoles = session.user.roles || [];
    const canBulkUpdate = userRoles.includes("HR") || userRoles.includes("ADMIN");
    
    if (!canBulkUpdate) {
      return NextResponse.json({ error: "Forbidden: HR or Admin role required" }, { status: 403 });
    }

    const body = await request.json();
    const { employeeIds, updates } = body;

    if (!employeeIds || !Array.isArray(employeeIds) || employeeIds.length === 0) {
      return NextResponse.json({ error: "No employees selected" }, { status: 400 });
    }

    if (!updates || Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No updates provided" }, { status: 400 });
    }

    // Validate allowed fields
    const allowedFields = ["departmentId", "legalEntityId", "status", "location", "managerId"];
    const updateData: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        // Handle empty strings as null
        updateData[key] = value === "" ? null : value;
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No valid updates provided" }, { status: 400 });
    }

    // Get current user's employee record for history
    const currentUserEmployee = await db.employee.findFirst({
      where: { email: session.user.email! },
    });

    // Perform bulk update
    const result = await db.employee.updateMany({
      where: { id: { in: employeeIds } },
      data: {
        ...updateData,
        updatedAt: new Date(),
      },
    });

    // Create audit event for bulk action
    await db.auditEvent.create({
      data: {
        actorId: currentUserEmployee?.id || null,
        actorEmail: session.user.email,
        action: "BULK_UPDATE",
        resourceType: "EMPLOYEE",
        resourceId: null,
        metadata: {
          employeeCount: employeeIds.length,
          employeeIds,
          updates: updateData,
        },
      },
    });

    return NextResponse.json({
      success: true,
      updatedCount: result.count,
    });
  } catch (error) {
    console.error("Bulk update error:", error);
    return NextResponse.json({ error: "Bulk update failed" }, { status: 500 });
  }
}
