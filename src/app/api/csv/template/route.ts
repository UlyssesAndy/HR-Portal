import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin, isHR } from "@/types";

// CSV Import Template Generator
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isAdmin(session.user as any) && !isHR(session.user as any)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Template CSV content
    const headers = [
      "email",
      "fullName", 
      "firstName",
      "lastName",
      "phone",
      "departmentName",
      "positionTitle",
      "managerEmail",
      "location",
      "hireDate",
      "birthday",
      "timezone",
      "legalEntityName",
      "status",
    ];

    const exampleRows = [
      [
        "john.doe@company.com",
        "John Doe",
        "John",
        "Doe",
        "+1-555-1234",
        "Engineering",
        "Software Engineer",
        "manager@company.com",
        "New York",
        "2024-01-15",
        "1990-05-20",
        "America/New_York",
        "Main Company LLC",
        "ACTIVE",
      ],
      [
        "jane.smith@company.com",
        "Jane Smith",
        "Jane",
        "Smith",
        "+1-555-5678",
        "Marketing",
        "Marketing Manager",
        "cmo@company.com",
        "Los Angeles",
        "2023-06-01",
        "1985-08-15",
        "America/Los_Angeles",
        "Main Company LLC",
        "ACTIVE",
      ],
    ];

    // Build CSV
    const csv = [
      headers.join(","),
      ...exampleRows.map(row => row.map(cell => `"${cell}"`).join(",")),
    ].join("\n");

    // Return as downloadable file
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": 'attachment; filename="employee-import-template.csv"',
      },
    });
  } catch (error) {
    console.error("Template download error:", error);
    return NextResponse.json(
      { error: "Failed to generate template" },
      { status: 500 }
    );
  }
}
