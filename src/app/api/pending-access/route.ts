import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// GET /api/pending-access - List pending access requests
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRoles = session.user.roles || [];
    if (!userRoles.includes("HR") && !userRoles.includes("ADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const requests = await db.pendingAccess.findMany({
      where: {
        ...(status && { status: status as any }),
      },
      include: {
        employee: { select: { id: true, fullName: true, email: true } },
        reviewedBy: { select: { id: true, fullName: true } },
      },
      orderBy: { requestedAt: "desc" },
    });

    return NextResponse.json(requests);
  } catch (error) {
    console.error("Failed to fetch pending access:", error);
    return NextResponse.json(
      { error: "Failed to fetch pending access" },
      { status: 500 }
    );
  }
}

// POST /api/pending-access - Create new pending access (manual)
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

    const body = await request.json();
    const { email, fullName, note } = body;

    if (!email?.trim()) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Check if already exists
    const existing = await db.pendingAccess.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "Email already in pending access queue" },
        { status: 400 }
      );
    }

    // Check if already an employee
    const employee = await db.employee.findUnique({ where: { email } });
    if (employee) {
      return NextResponse.json(
        { error: "This email belongs to an existing employee" },
        { status: 400 }
      );
    }

    const pendingAccess = await db.pendingAccess.create({
      data: {
        email: email.trim().toLowerCase(),
        fullName: fullName?.trim() || null,
        source: "MANUAL",
        sourceReference: note?.trim() || null,
        status: "PENDING",
      },
    });

    await db.auditEvent.create({
      data: {
        actorId: session.user.id,
        actorEmail: session.user.email,
        action: "pending_access.create",
        resourceType: "PendingAccess",
        resourceId: pendingAccess.id,
        newValues: { email, fullName },
      },
    });

    return NextResponse.json(pendingAccess, { status: 201 });
  } catch (error) {
    console.error("Failed to create pending access:", error);
    return NextResponse.json(
      { error: "Failed to create pending access" },
      { status: 500 }
    );
  }
}
