import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// Get upcoming birthdays in the next N days
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const days = parseInt(searchParams.get("days") || "30");

    // Get all active employees with birthdays
    const employees = await db.employee.findMany({
      where: {
        status: { not: "TERMINATED" },
        birthDate: { not: null },
      },
      select: {
        id: true,
        fullName: true,
        avatarUrl: true,
        birthDate: true,
        department: { select: { name: true } },
      },
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcomingBirthdays = employees
      .map((emp) => {
        if (!emp.birthDate) return null;

        const birthDate = new Date(emp.birthDate);
        
        // Calculate this year's birthday
        const thisYearBirthday = new Date(
          today.getFullYear(),
          birthDate.getMonth(),
          birthDate.getDate()
        );

        // If birthday has passed this year, check next year
        let nextBirthday = thisYearBirthday;
        if (thisYearBirthday < today) {
          nextBirthday = new Date(
            today.getFullYear() + 1,
            birthDate.getMonth(),
            birthDate.getDate()
          );
        }

        const daysUntil = Math.ceil(
          (nextBirthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );

        // Calculate age
        let age = nextBirthday.getFullYear() - birthDate.getFullYear();
        
        return {
          id: emp.id,
          fullName: emp.fullName,
          avatarUrl: emp.avatarUrl,
          department: emp.department?.name || null,
          birthDate: emp.birthDate,
          nextBirthday: nextBirthday.toISOString(),
          daysUntil,
          turningAge: age,
          isToday: daysUntil === 0,
          isThisWeek: daysUntil > 0 && daysUntil <= 7,
        };
      })
      .filter((b): b is NonNullable<typeof b> => b !== null && b.daysUntil <= days)
      .sort((a, b) => a.daysUntil - b.daysUntil);

    return NextResponse.json({
      birthdays: upcomingBirthdays,
      todayCount: upcomingBirthdays.filter((b) => b.isToday).length,
      thisWeekCount: upcomingBirthdays.filter((b) => b.isThisWeek).length,
    });
  } catch (error) {
    console.error("Birthdays API error:", error);
    return NextResponse.json({ error: "Failed to fetch birthdays" }, { status: 500 });
  }
}
