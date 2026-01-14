import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// POST /api/employees/[id]/history - Add history correction
export async function POST(
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
    const { fieldName, oldValue, newValue, changeNote, effectiveDate } = body;

    // Validate employee exists
    const employee = await db.employee.findUnique({ where: { id } });
    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    if (!fieldName) {
      return NextResponse.json({ error: "Field name is required" }, { status: 400 });
    }

    // Create history correction entry
    const historyEntry = await db.employeeHistory.create({
      data: {
        employeeId: id,
        fieldName,
        oldValue: oldValue || null,
        newValue: newValue || null,
        changedById: session.user.id,
        changeSource: "MANUAL",
        changeNote: changeNote || "Manual history correction",
        isCorrection: true,
        changedAt: effectiveDate ? new Date(effectiveDate) : new Date(),
      },
      include: {
        changedBy: { select: { id: true, fullName: true } },
      },
    });

    // Update employee field if newValue is provided and field exists
    const updateableFields = [
      "departmentId",
      "positionId",
      "managerId",
      "status",
      "location",
      "phone",
    ];

    if (newValue && updateableFields.includes(fieldName)) {
      try {
        await db.employee.update({
          where: { id },
          data: { [fieldName]: newValue },
        });
      } catch (e) {
        // Field might not exist or value might be invalid - log but don't fail
        console.warn(`Could not update employee.${fieldName}:`, e);
      }
    }

    // Audit log
    await db.auditEvent.create({
      data: {
        actorId: session.user.id,
        actorEmail: session.user.email,
        action: "history.correction",
        resourceType: "EmployeeHistory",
        resourceId: historyEntry.id,
        metadata: {
          employeeId: id,
          employeeName: employee.fullName,
          fieldName,
          oldValue,
          newValue,
        },
      },
    });

    return NextResponse.json(historyEntry, { status: 201 });
  } catch (error) {
    console.error("Failed to add history correction:", error);
    return NextResponse.json(
      { error: "Failed to add history correction" },
      { status: 500 }
    );
  }
}

// GET /api/employees/[id]/history - Get employee history
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

    const history = await db.employeeHistory.findMany({
      where: { employeeId: id },
      include: {
        changedBy: { select: { id: true, fullName: true } },
      },
      orderBy: { changedAt: "desc" },
      take: 100,
    });

    return NextResponse.json(history);
  } catch (error) {
    console.error("Failed to fetch history:", error);
    return NextResponse.json(
      { error: "Failed to fetch history" },
      { status: 500 }
    );
  }
}
