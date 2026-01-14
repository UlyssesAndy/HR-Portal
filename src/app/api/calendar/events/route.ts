import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const year = parseInt(searchParams.get("year") || new Date().getFullYear().toString());
  const month = parseInt(searchParams.get("month") || (new Date().getMonth() + 1).toString());

  // For MVP, return mock data based on employee status
  // In production, this would come from a dedicated TimeOff/Leave table
  const employees = await db.employee.findMany({
    where: {
      status: "ON_LEAVE",
    },
    select: {
      id: true,
      fullName: true,
      avatarUrl: true,
      status: true,
    },
  });

  // Generate mock events for employees on leave
  const events = employees.map((emp, idx) => {
    const startDay = Math.floor(Math.random() * 20) + 1;
    const duration = Math.floor(Math.random() * 7) + 3;
    
    return {
      id: `event-${emp.id}`,
      employeeId: emp.id,
      employeeName: emp.fullName,
      avatarUrl: emp.avatarUrl,
      type: "vacation" as const,
      startDate: new Date(year, month - 1, startDay).toISOString(),
      endDate: new Date(year, month - 1, Math.min(startDay + duration, 28)).toISOString(),
    };
  });

  // Add some mock upcoming events
  const mockFutureEvents = [
    {
      id: "mock-1",
      employeeId: "mock",
      employeeName: "Team Meeting",
      avatarUrl: null,
      type: "business_trip" as const,
      startDate: new Date(year, month - 1, 15).toISOString(),
      endDate: new Date(year, month - 1, 17).toISOString(),
    },
  ];

  return NextResponse.json([...events, ...mockFutureEvents]);
}
