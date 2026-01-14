import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { ChangeSource, Prisma } from "@prisma/client";

interface Params {
  params: Promise<{ id: string }>;
}

// Allow employees to update their own contact info (limited fields)
export async function PATCH(request: Request, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    
    // Get the user's employee record
    const userEmployee = await db.employee.findFirst({
      where: { email: session.user.email! },
      select: { id: true },
    });

    if (!userEmployee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }
    
    // User can only update their own profile
    if (userEmployee.id !== id) {
      return NextResponse.json(
        { error: "You can only edit your own profile" }, 
        { status: 403 }
      );
    }

    const body = await request.json();
    
    // Only allow specific fields to be updated by the employee
    const allowedFields = ["phone", "timezone"];
    const updateData: Record<string, any> = {};
    
    for (const field of allowedFields) {
      if (field in body) {
        updateData[field] = body[field] || null;
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" }, 
        { status: 400 }
      );
    }

    // Get current employee data for history tracking
    const currentEmployee = await db.employee.findUnique({
      where: { id },
      select: { phone: true, timezone: true },
    });

    if (!currentEmployee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    // Update employee
    const updatedEmployee = await db.employee.update({
      where: { id },
      data: updateData,
    });

    // Create history records for changed fields
    const historyEntries: Prisma.EmployeeHistoryCreateManyInput[] = [];
    for (const field of Object.keys(updateData)) {
      const oldValue = currentEmployee[field as keyof typeof currentEmployee];
      const newValue = updateData[field];
      
      if (oldValue !== newValue) {
        historyEntries.push({
          employeeId: id,
          fieldName: field,
          oldValue: oldValue ? String(oldValue) : null,
          newValue: newValue ? String(newValue) : null,
          changedById: userEmployee.id,
          changeSource: ChangeSource.MANUAL,
        });
      }
    }

    if (historyEntries.length > 0) {
      await db.employeeHistory.createMany({ data: historyEntries });
    }

    return NextResponse.json(updatedEmployee);
  } catch (error) {
    console.error("Self-update error:", error);
    return NextResponse.json(
      { error: "Failed to update profile" }, 
      { status: 500 }
    );
  }
}
