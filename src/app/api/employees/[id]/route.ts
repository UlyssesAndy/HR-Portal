import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has HR or Admin role
    const userRoles = session.user.roles || [];
    const canEdit = userRoles.includes("HR") || userRoles.includes("ADMIN");
    
    if (!canEdit) {
      return NextResponse.json({ error: "Forbidden: HR or Admin role required" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();

    // Get current user's employee record for history tracking
    const currentUserEmployee = await db.employee.findFirst({
      where: { email: session.user.email! },
    });

    // Get existing employee
    const existingEmployee = await db.employee.findUnique({
      where: { id },
    });

    if (!existingEmployee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    // Build update data
    const updateData: any = {};
    const historyRecords: any[] = [];

    // Track changes for history
    const trackableFields = [
      "fullName", "email", "phone", "location", "timezone", "status",
      "departmentId", "positionId", "managerId", "startDate", "birthDate",
      "employmentType", "legalEntityId", "statusNote", "statusStartDate", "statusEndDate",
      "mattermostUsername", "telegramHandle", "messengerHandle",
      "emergencyContactName", "emergencyContactPhone", "emergencyContactEmail"
    ];

    for (const field of trackableFields) {
      if (body[field] !== undefined) {
        let newValue = body[field] === "" ? null : body[field];
        let oldValue = (existingEmployee as any)[field];

        // Handle date fields
        if (field.includes("Date") && newValue) {
          newValue = new Date(newValue);
          if (oldValue) {
            oldValue = oldValue.toISOString().split("T")[0];
            newValue = newValue.toISOString().split("T")[0];
          }
        }

        // Check if value actually changed
        const oldStr = oldValue?.toString() || null;
        const newStr = newValue?.toString() || null;

        if (oldStr !== newStr) {
          updateData[field] = body[field] === "" ? null : body[field];
          
          // Handle date conversion for update
          if (field.includes("Date") && updateData[field]) {
            updateData[field] = new Date(updateData[field]);
          }

          historyRecords.push({
            employeeId: id,
            fieldName: field,
            oldValue: oldStr,
            newValue: newStr,
            changedById: currentUserEmployee?.id || null,
            changeSource: "MANUAL",
          });
        }
      }
    }

    // If no changes, return success
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ message: "No changes detected" });
    }

    // Update employee and create history records
    const [updatedEmployee] = await db.$transaction([
      db.employee.update({
        where: { id },
        data: {
          ...updateData,
          updatedAt: new Date(),
        },
        include: {
          department: true,
          position: true,
          manager: { select: { id: true, fullName: true } },
        },
      }),
      ...historyRecords.map(record => 
        db.employeeHistory.create({ data: record })
      ),
    ]);

    // Create audit event
    await db.auditEvent.create({
      data: {
        actorId: currentUserEmployee?.id || null,
        actorEmail: session.user.email,
        action: "UPDATE",
        resourceType: "EMPLOYEE",
        resourceId: id,
        oldValues: historyRecords.reduce((acc, r) => ({ ...acc, [r.fieldName]: r.oldValue }), {}),
        newValues: historyRecords.reduce((acc, r) => ({ ...acc, [r.fieldName]: r.newValue }), {}),
      },
    });

    return NextResponse.json(updatedEmployee);
  } catch (error) {
    console.error("Error updating employee:", error);
    return NextResponse.json(
      { error: "Failed to update employee" },
      { status: 500 }
    );
  }
}

// DELETE employee (permanent deletion)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only ADMIN can permanently delete employees
    const userRoles = session.user.roles || [];
    if (!userRoles.includes("ADMIN")) {
      return NextResponse.json(
        { error: "Forbidden: Admin role required for deletion" },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Get employee data before deletion for audit
    const employee = await db.employee.findUnique({
      where: { id },
      select: {
        id: true,
        fullName: true,
        email: true,
      },
    });

    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    // Prevent deleting yourself
    if (employee.email === session.user.email) {
      return NextResponse.json(
        { error: "Cannot delete your own account" },
        { status: 400 }
      );
    }

    // Delete employee and all related data (cascade)
    await db.employee.delete({
      where: { id },
    });

    // Get current user's employee record for audit
    const currentUserEmployee = await db.employee.findFirst({
      where: { email: session.user.email! },
    });

    // Create audit event
    await db.auditEvent.create({
      data: {
        actorId: currentUserEmployee?.id || null,
        actorEmail: session.user.email,
        action: "employee.deleted",
        resourceType: "employee",
        resourceId: id,
        metadata: {
          deletedEmployee: {
            id: employee.id,
            fullName: employee.fullName,
            email: employee.email,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Employee permanently deleted",
    });
  } catch (error) {
    console.error("Error deleting employee:", error);
    return NextResponse.json(
      { error: "Failed to delete employee" },
      { status: 500 }
    );
  }
}

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

    const employee = await db.employee.findUnique({
      where: { id },
      include: {
        department: true,
        position: true,
        manager: { select: { id: true, fullName: true, avatarUrl: true } },
        directReports: {
          where: { status: { not: "TERMINATED" } },
          include: { position: true },
        },
        roleAssignments: true,
        history: {
          orderBy: { changedAt: "desc" },
          take: 20,
          include: {
            changedBy: { select: { id: true, fullName: true } },
          },
        },
      },
    });

    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    return NextResponse.json(employee);
  } catch (error) {
    console.error("Error fetching employee:", error);
    return NextResponse.json(
      { error: "Failed to fetch employee" },
      { status: 500 }
    );
  }
}
