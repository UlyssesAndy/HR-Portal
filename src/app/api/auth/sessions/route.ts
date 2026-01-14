import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { cookies } from "next/headers";

// GET - List all active sessions
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const credentials = await db.userCredentials.findUnique({
      where: { employeeId: session.user.id },
      include: {
        sessions: {
          where: { isActive: true },
          orderBy: { lastActiveAt: "desc" },
        },
      },
    });

    if (!credentials) {
      return NextResponse.json({ sessions: [] });
    }

    // Get current session token from cookie
    const cookieStore = await cookies();
    const currentToken = cookieStore.get("authjs.session-token")?.value;
    const currentTokenPrefix = currentToken?.slice(0, 64);

    const sessions = credentials.sessions.map((s) => ({
      id: s.id,
      deviceInfo: s.deviceInfo,
      ipAddress: s.ipAddress,
      createdAt: s.createdAt,
      lastActiveAt: s.lastActiveAt,
      expiresAt: s.expiresAt,
      isCurrent: s.sessionToken === currentTokenPrefix,
    }));

    return NextResponse.json({ sessions });
  } catch (error) {
    console.error("Sessions fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Revoke session(s)
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { sessionId, revokeAll } = body;

    const credentials = await db.userCredentials.findUnique({
      where: { employeeId: session.user.id },
    });

    if (!credentials) {
      return NextResponse.json(
        { error: "No credentials found" },
        { status: 404 }
      );
    }

    // Get current session token from cookie
    const cookieStore = await cookies();
    const currentToken = cookieStore.get("authjs.session-token")?.value;
    const currentTokenPrefix = currentToken?.slice(0, 64);

    if (revokeAll) {
      // Revoke all sessions except current
      await db.userSession.updateMany({
        where: {
          credentialsId: credentials.id,
          isActive: true,
          sessionToken: { not: currentTokenPrefix },
        },
        data: {
          isActive: false,
          revokedAt: new Date(),
        },
      });

      // Audit log
      await db.auditEvent.create({
        data: {
          actorId: session.user.id,
          actorEmail: session.user.email,
          action: "auth.sessions_revoked_all",
          resourceType: "user_session",
          resourceId: session.user.id,
        },
      });

      return NextResponse.json({
        success: true,
        message: "All other sessions have been revoked",
      });
    }

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 }
      );
    }

    // Check if trying to revoke current session
    const targetSession = await db.userSession.findUnique({
      where: { id: sessionId },
    });

    if (!targetSession || targetSession.credentialsId !== credentials.id) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    if (targetSession.sessionToken === currentTokenPrefix) {
      return NextResponse.json(
        { error: "Cannot revoke current session. Use logout instead." },
        { status: 400 }
      );
    }

    // Revoke the session
    await db.userSession.update({
      where: { id: sessionId },
      data: {
        isActive: false,
        revokedAt: new Date(),
      },
    });

    // Audit log
    await db.auditEvent.create({
      data: {
        actorId: session.user.id,
        actorEmail: session.user.email,
        action: "auth.session_revoked",
        resourceType: "user_session",
        resourceId: sessionId,
        metadata: {
          deviceInfo: targetSession.deviceInfo,
          ipAddress: targetSession.ipAddress,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Session has been revoked",
    });
  } catch (error) {
    console.error("Session revoke error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
