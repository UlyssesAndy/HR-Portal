import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only HR and ADMIN can export
    const userRoles = session.user.roles || [];
    const canExport = userRoles.includes("HR") || userRoles.includes("ADMIN");
    
    if (!canExport) {
      return NextResponse.json({ error: "Forbidden: HR or Admin role required" }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q") || "";
    const departmentId = searchParams.get("department") || undefined;
    const status = searchParams.get("status") || undefined;
    const managerId = searchParams.get("manager") || undefined;
    const location = searchParams.get("location") || undefined;
    const legalEntityId = searchParams.get("legalEntity") || undefined;

    // Build where clause
    const where: Prisma.EmployeeWhereInput = {
      status: status ? (status as any) : { not: "TERMINATED" },
    };

    if (departmentId) {
      where.departmentId = departmentId;
    }

    if (managerId) {
      where.managerId = managerId;
    }

    if (location) {
      where.location = location;
    }

    if (legalEntityId) {
      (where as any).legalEntityId = legalEntityId;
    }

    if (query) {
      where.OR = [
        { fullName: { contains: query, mode: "insensitive" } },
        { email: { contains: query, mode: "insensitive" } },
        { position: { title: { contains: query, mode: "insensitive" } } },
        { department: { name: { contains: query, mode: "insensitive" } } },
      ];
    }

    // Fetch employees with relations
    const employees = await (db.employee.findMany as any)({
      where,
      include: {
        department: { select: { name: true } },
        position: { select: { title: true } },
        manager: { select: { fullName: true } },
        legalEntity: { select: { name: true, shortName: true } },
      },
      orderBy: { fullName: "asc" },
    });

    // Generate CSV
    const headers = [
      "Full Name",
      "Email",
      "Status",
      "Department",
      "Position",
      "Manager",
      "Location",
      "Phone",
      "Timezone",
      "Employment Type",
      "Legal Entity",
      "Start Date",
      "Birth Date",
    ];

    const rows = employees.map((emp: any) => [
      escapeCsvField(emp.fullName),
      escapeCsvField(emp.email),
      escapeCsvField(emp.status),
      escapeCsvField(emp.department?.name || ""),
      escapeCsvField(emp.position?.title || ""),
      escapeCsvField(emp.manager?.fullName || ""),
      escapeCsvField(emp.location || ""),
      escapeCsvField(emp.phone || ""),
      escapeCsvField(emp.timezone || ""),
      escapeCsvField(emp.employmentType || ""),
      escapeCsvField(emp.legalEntity?.shortName || emp.legalEntity?.name || ""),
      escapeCsvField(emp.startDate ? emp.startDate.toISOString().split("T")[0] : ""),
      escapeCsvField(emp.birthDate ? emp.birthDate.toISOString().split("T")[0] : ""),
    ]);

    const csv = [headers.join(","), ...rows.map((row: string[]) => row.join(","))].join("\n");

    // Generate filename with date
    const date = new Date().toISOString().split("T")[0];
    const filename = `employees_export_${date}.csv`;

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}

function escapeCsvField(field: string): string {
  if (!field) return "";
  // Escape quotes and wrap in quotes if contains comma, quote, or newline
  if (field.includes(",") || field.includes('"') || field.includes("\n")) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}
