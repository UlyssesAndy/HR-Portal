import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { isAdmin, isHR } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const employeeId = formData.get("employeeId") as string;

    if (!file || !employeeId) {
      return NextResponse.json(
        { error: "File and employeeId are required" },
        { status: 400 }
      );
    }

    // Check permissions - HR/ADMIN can upload for anyone, users can upload their own
    const employee = await db.employee.findUnique({
      where: { id: employeeId },
      select: { email: true },
    });

    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    const canUpload = 
      isAdmin(session.user as any) || 
      isHR(session.user as any) || 
      employee.email === session.user.email;

    if (!canUpload) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Validate file
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Only image files are allowed" },
        { status: 400 }
      );
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File size must be less than 5MB" },
        { status: 400 }
      );
    }

    // Convert to base64 data URL for storage
    // In production, would upload to S3/CloudStorage
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString("base64");
    const dataUrl = `data:${file.type};base64,${base64}`;

    // Update employee avatar
    await db.employee.update({
      where: { id: employeeId },
      data: { avatarUrl: dataUrl },
    });

    // Audit log
    await db.auditEvent.create({
      data: {
        actorId: session.user.id,
        actorEmail: session.user.email || "",
        action: "employee.photo_upload",
        resourceType: "Employee",
        resourceId: employeeId,
        newValues: {
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
        },
      },
    });

    return NextResponse.json({ 
      success: true, 
      url: dataUrl,
      message: "Photo uploaded successfully" 
    });
  } catch (error) {
    console.error("Photo upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload photo" },
      { status: 500 }
    );
  }
}
