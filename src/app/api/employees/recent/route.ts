import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// Get recently hired employees
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "5");

    const employees = await db.employee.findMany({
      select: {
        id: true,
        fullName: true,
        avatarUrl: true,
        startDate: true,
        createdAt: true,
        position: { select: { title: true } },
        department: { select: { name: true } },
      },
      orderBy: [
        { startDate: { sort: "desc", nulls: "last" } },
        { createdAt: "desc" },
      ],
      take: limit,
    });

    return NextResponse.json({ 
      employees: employees.map(e => ({
        ...e,
        hireDate: e.startDate?.toISOString() || null,
        createdAt: e.createdAt.toISOString(),
      }))
    });
  } catch (error) {
    console.error("Recent employees error:", error);
    return NextResponse.json(
      { error: "Failed to get recent employees" },
      { status: 500 }
    );
  }
}
