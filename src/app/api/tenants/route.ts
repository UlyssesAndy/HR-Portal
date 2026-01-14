import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// GET /api/tenants - List all tenants
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRoles = session.user.roles || [];
    if (!userRoles.includes("ADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const tenants = await db.googleWorkspaceTenant.findMany({
      include: {
        defaultLegalEntity: { select: { id: true, name: true } },
        _count: {
          select: {
            employees: true,
            syncRuns: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Remove sensitive data before sending
    const sanitized = tenants.map((t) => ({
      ...t,
      serviceAccountKey: t.serviceAccountKey ? "[CONFIGURED]" : null,
    }));

    return NextResponse.json(sanitized);
  } catch (error) {
    console.error("Failed to fetch tenants:", error);
    return NextResponse.json(
      { error: "Failed to fetch tenants" },
      { status: 500 }
    );
  }
}

// POST /api/tenants - Create new tenant
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRoles = session.user.roles || [];
    if (!userRoles.includes("ADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const {
      name,
      domain,
      customerId,
      serviceAccountEmail,
      serviceAccountKey,
      adminEmail,
      syncEnabled = true,
      syncInterval = 1440,
      allowedDomains = [],
      autoProvision = true,
      defaultLegalEntityId,
    } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    if (!domain?.trim()) {
      return NextResponse.json({ error: "Domain is required" }, { status: 400 });
    }

    // Check if domain already exists
    const existing = await db.googleWorkspaceTenant.findUnique({
      where: { domain: domain.toLowerCase() },
    });

    if (existing) {
      return NextResponse.json(
        { error: "A tenant with this domain already exists" },
        { status: 409 }
      );
    }

    const tenant = await db.googleWorkspaceTenant.create({
      data: {
        name: name.trim(),
        domain: domain.toLowerCase().trim(),
        customerId: customerId?.trim() || null,
        serviceAccountEmail: serviceAccountEmail?.trim() || null,
        serviceAccountKey: serviceAccountKey || null,
        adminEmail: adminEmail?.trim() || null,
        syncEnabled,
        syncInterval,
        allowedDomains: allowedDomains.map((d: string) => d.toLowerCase().trim()),
        autoProvision,
        defaultLegalEntityId: defaultLegalEntityId || null,
      },
    });

    // Audit log
    await db.auditEvent.create({
      data: {
        actorId: session.user.id,
        actorEmail: session.user.email,
        action: "tenant.create",
        resourceType: "GoogleWorkspaceTenant",
        resourceId: tenant.id,
        newValues: { name, domain },
      },
    });

    return NextResponse.json(
      { ...tenant, serviceAccountKey: tenant.serviceAccountKey ? "[CONFIGURED]" : null },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to create tenant:", error);
    return NextResponse.json(
      { error: "Failed to create tenant" },
      { status: 500 }
    );
  }
}

// PUT /api/tenants - Update tenant
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRoles = session.user.roles || [];
    if (!userRoles.includes("ADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const {
      id,
      name,
      domain,
      customerId,
      serviceAccountEmail,
      serviceAccountKey,
      adminEmail,
      syncEnabled,
      syncInterval,
      allowedDomains,
      autoProvision,
      defaultLegalEntityId,
      isActive,
    } = body;

    if (!id) {
      return NextResponse.json({ error: "Tenant ID is required" }, { status: 400 });
    }

    // Get existing tenant
    const existing = await db.googleWorkspaceTenant.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    // Check domain uniqueness if changed
    if (domain && domain.toLowerCase() !== existing.domain) {
      const domainExists = await db.googleWorkspaceTenant.findUnique({
        where: { domain: domain.toLowerCase() },
      });
      if (domainExists) {
        return NextResponse.json(
          { error: "A tenant with this domain already exists" },
          { status: 409 }
        );
      }
    }

    // Build update data (only include provided fields)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim();
    if (domain !== undefined) updateData.domain = domain.toLowerCase().trim();
    if (customerId !== undefined) updateData.customerId = customerId?.trim() || null;
    if (serviceAccountEmail !== undefined) updateData.serviceAccountEmail = serviceAccountEmail?.trim() || null;
    if (serviceAccountKey !== undefined) updateData.serviceAccountKey = serviceAccountKey || null;
    if (adminEmail !== undefined) updateData.adminEmail = adminEmail?.trim() || null;
    if (syncEnabled !== undefined) updateData.syncEnabled = syncEnabled;
    if (syncInterval !== undefined) updateData.syncInterval = syncInterval;
    if (allowedDomains !== undefined) updateData.allowedDomains = allowedDomains.map((d: string) => d.toLowerCase().trim());
    if (autoProvision !== undefined) updateData.autoProvision = autoProvision;
    if (defaultLegalEntityId !== undefined) updateData.defaultLegalEntityId = defaultLegalEntityId || null;
    if (isActive !== undefined) updateData.isActive = isActive;

    const tenant = await db.googleWorkspaceTenant.update({
      where: { id },
      data: updateData,
    });

    // Audit log
    await db.auditEvent.create({
      data: {
        actorId: session.user.id,
        actorEmail: session.user.email,
        action: "tenant.update",
        resourceType: "GoogleWorkspaceTenant",
        resourceId: tenant.id,
        oldValues: { name: existing.name, domain: existing.domain },
        newValues: updateData,
      },
    });

    return NextResponse.json({
      ...tenant,
      serviceAccountKey: tenant.serviceAccountKey ? "[CONFIGURED]" : null,
    });
  } catch (error) {
    console.error("Failed to update tenant:", error);
    return NextResponse.json(
      { error: "Failed to update tenant" },
      { status: 500 }
    );
  }
}

// DELETE /api/tenants - Delete tenant
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRoles = session.user.roles || [];
    if (!userRoles.includes("ADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Tenant ID is required" }, { status: 400 });
    }

    const existing = await db.googleWorkspaceTenant.findUnique({
      where: { id },
      include: { _count: { select: { employees: true } } },
    });

    if (!existing) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    // Warn if employees are linked
    if (existing._count.employees > 0) {
      return NextResponse.json(
        { 
          error: `Cannot delete tenant with ${existing._count.employees} linked employees. Unlink employees first or deactivate the tenant.` 
        },
        { status: 400 }
      );
    }

    await db.googleWorkspaceTenant.delete({
      where: { id },
    });

    // Audit log
    await db.auditEvent.create({
      data: {
        actorId: session.user.id,
        actorEmail: session.user.email,
        action: "tenant.delete",
        resourceType: "GoogleWorkspaceTenant",
        resourceId: id,
        oldValues: { name: existing.name, domain: existing.domain },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete tenant:", error);
    return NextResponse.json(
      { error: "Failed to delete tenant" },
      { status: 500 }
    );
  }
}
