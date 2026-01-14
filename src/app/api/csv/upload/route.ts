import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRoles = session.user.roles || [];
    if (!userRoles.includes("HR") && !userRoles.includes("ADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const content = await file.text();
    const lines = content.split("\n").filter(line => line.trim());
    
    if (lines.length < 2) {
      return NextResponse.json({ error: "CSV file is empty or has no data rows" }, { status: 400 });
    }

    // Parse headers
    const headers = lines[0].split(",").map(h => h.trim().toLowerCase().replace(/"/g, ""));
    
    // Validate required columns
    const requiredColumns = ["email", "fullname"];
    const missingColumns = requiredColumns.filter(col => !headers.includes(col));
    if (missingColumns.length > 0) {
      return NextResponse.json({ 
        error: `Missing required columns: ${missingColumns.join(", ")}` 
      }, { status: 400 });
    }

    // Get column indexes
    const colIndex = (name: string) => headers.indexOf(name);

    // Parse data rows
    const errors: Array<{ row: number; field: string; message: string }> = [];
    const preview: Array<{ email: string; fullName: string; action: "create" | "update" }> = [];
    const parsedRows: any[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      const rowNum = i + 1;

      const email = values[colIndex("email")]?.trim();
      const fullName = values[colIndex("fullname")]?.trim();

      // Validate required fields
      if (!email) {
        errors.push({ row: rowNum, field: "email", message: "Email is required" });
        continue;
      }
      if (!fullName) {
        errors.push({ row: rowNum, field: "fullName", message: "Full name is required" });
        continue;
      }

      // Validate email format
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.push({ row: rowNum, field: "email", message: "Invalid email format" });
        continue;
      }

      // Check if employee exists
      const existingEmployee = await db.employee.findUnique({ where: { email } });

      const rowData: any = {
        email,
        fullName,
        firstName: values[colIndex("firstname")]?.trim() || null,
        lastName: values[colIndex("lastname")]?.trim() || null,
        phone: values[colIndex("phone")]?.trim() || null,
        location: values[colIndex("location")]?.trim() || null,
        department: values[colIndex("department")]?.trim() || null,
        position: values[colIndex("position")]?.trim() || null,
        managerEmail: values[colIndex("manager_email")]?.trim() || null,
        status: values[colIndex("status")]?.trim()?.toUpperCase() || null,
        startDate: parseDate(values[colIndex("startdate")]?.trim()),
        birthDate: parseDate(values[colIndex("birthdate")]?.trim()),
      };

      // Validate status if provided
      const validStatuses = ["ACTIVE", "ON_LEAVE", "MATERNITY", "TERMINATED", "PENDING"];
      if (rowData.status && !validStatuses.includes(rowData.status)) {
        errors.push({ row: rowNum, field: "status", message: `Invalid status. Must be one of: ${validStatuses.join(", ")}` });
        continue;
      }

      parsedRows.push(rowData);
      preview.push({
        email,
        fullName,
        action: existingEmployee ? "update" : "create",
      });
    }

    // Create import record
    const csvImport = await db.csvImport.create({
      data: {
        filename: file.name,
        uploadedById: session.user.id,
        status: "dry_run",
        dryRunAt: new Date(),
        dryRunValidRows: parsedRows.length,
        dryRunErrorRows: errors.length,
        dryRunErrors: errors.length > 0 ? errors : undefined,
      },
    });

    // Store parsed data temporarily (in real app, use Redis or temp storage)
    // For MVP, we'll re-parse on commit
    
    return NextResponse.json({
      importId: csvImport.id,
      dryRun: {
        validRows: parsedRows.length,
        errorRows: errors.length,
        errors,
        preview: preview.slice(0, 20),
      },
    });
  } catch (error) {
    console.error("CSV upload error:", error);
    return NextResponse.json({ error: "Failed to process CSV" }, { status: 500 });
  }
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  
  return result.map(v => v.replace(/^"|"$/g, ""));
}

function parseDate(value: string | undefined): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return isNaN(date.getTime()) ? null : date;
}

export async function GET() {
  // Return CSV template
  const template = `email,fullName,firstName,lastName,department,position,manager_email,phone,location,startDate,birthDate,status
john.doe@example.com,John Doe,John,Doe,Engineering,Software Engineer,manager@example.com,+1-555-0100,New York,2024-01-15,1990-05-20,ACTIVE
jane.smith@example.com,Jane Smith,Jane,Smith,Product,Product Manager,,+1-555-0101,San Francisco,2024-02-01,1988-11-10,ACTIVE`;

  return new NextResponse(template, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": "attachment; filename=employee_import_template.csv",
    },
  });
}
