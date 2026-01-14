// Google Workspace Directory Sync Service
// Syncs users from Google Admin SDK Directory API

import { google, admin_directory_v1 } from "googleapis";
import { db } from "@/lib/db";
import { GoogleWorkspaceTenant, Employee, SyncRun } from "@prisma/client";

// Types
interface GoogleUser {
  id: string;
  primaryEmail: string;
  name: {
    fullName: string;
    givenName?: string;
    familyName?: string;
  };
  thumbnailPhotoUrl?: string;
  suspended?: boolean;
  orgUnitPath?: string;
  phones?: Array<{ value: string; type: string }>;
  locations?: Array<{ buildingId?: string; floorName?: string }>;
  customSchemas?: Record<string, Record<string, unknown>>;
}

interface SyncResult {
  success: boolean;
  usersProcessed: number;
  usersCreated: number;
  usersUpdated: number;
  usersDeactivated: number;
  errors: Array<{ email: string; error: string }>;
}

// Get authenticated Admin SDK client for a tenant
async function getAdminClient(tenant: GoogleWorkspaceTenant): Promise<admin_directory_v1.Admin | null> {
  if (!tenant.serviceAccountKey || !tenant.adminEmail) {
    console.error(`[Sync] Tenant ${tenant.name}: Missing service account key or admin email`);
    return null;
  }

  try {
    // Parse the service account key (stored as JSON string)
    const credentials = JSON.parse(tenant.serviceAccountKey);

    // Create JWT client with domain-wide delegation
    const auth = new google.auth.JWT({
      email: credentials.client_email,
      key: credentials.private_key,
      scopes: [
        "https://www.googleapis.com/auth/admin.directory.user.readonly",
        "https://www.googleapis.com/auth/admin.directory.group.readonly",
      ],
      subject: tenant.adminEmail, // Impersonate admin
    });

    // Create Admin SDK client
    const admin = google.admin({ version: "directory_v1", auth });
    return admin;
  } catch (error) {
    console.error(`[Sync] Failed to create Admin client for ${tenant.name}:`, error);
    return null;
  }
}

// Fetch all users from Google Workspace
async function fetchGoogleUsers(
  admin: admin_directory_v1.Admin,
  tenant: GoogleWorkspaceTenant
): Promise<GoogleUser[]> {
  const users: GoogleUser[] = [];
  let pageToken: string | undefined;

  do {
    const response = await admin.users.list({
      customer: tenant.customerId || "my_customer",
      maxResults: 500,
      pageToken,
      projection: "full",
      orderBy: "email",
    });

    if (response.data.users) {
      users.push(...(response.data.users as unknown as GoogleUser[]));
    }

    pageToken = response.data.nextPageToken || undefined;
  } while (pageToken);

  console.log(`[Sync] Fetched ${users.length} users from Google for ${tenant.domain}`);
  return users;
}

// Sync a single user
async function syncUser(
  googleUser: GoogleUser,
  tenant: GoogleWorkspaceTenant,
  existingEmployee: Employee | null
): Promise<{ action: "created" | "updated" | "deactivated" | "skipped"; error?: string }> {
  try {
    const email = googleUser.primaryEmail.toLowerCase();
    const isDeactivated = googleUser.suspended === true;

    // Get phone number from Google
    const phone = googleUser.phones?.find((p) => p.type === "work" || p.type === "mobile")?.value;
    
    // Get location
    const location = googleUser.locations?.[0]?.buildingId || null;

    if (existingEmployee) {
      // Check if user was suspended
      if (isDeactivated && existingEmployee.status !== "TERMINATED") {
        await db.employee.update({
          where: { id: existingEmployee.id },
          data: {
            status: "TERMINATED",
            terminationDate: new Date(),
            lastSyncedAt: new Date(),
          },
        });
        return { action: "deactivated" };
      }

      // Skip if manually overridden fields exist
      const manualFields = (existingEmployee.manualOverrideFields as string[]) || [];
      
      // Update employee - respect manual overrides
      const updateData: Record<string, unknown> = {
        lastSyncedAt: new Date(),
        isSyncedFromGoogle: true,
        tenantId: tenant.id,
      };

      if (!manualFields.includes("fullName") && googleUser.name?.fullName) {
        updateData.fullName = googleUser.name.fullName;
      }
      if (!manualFields.includes("firstName") && googleUser.name?.givenName) {
        updateData.firstName = googleUser.name.givenName;
      }
      if (!manualFields.includes("lastName") && googleUser.name?.familyName) {
        updateData.lastName = googleUser.name.familyName;
      }
      if (!manualFields.includes("avatarUrl") && googleUser.thumbnailPhotoUrl) {
        updateData.avatarUrl = googleUser.thumbnailPhotoUrl;
      }
      if (!manualFields.includes("phone") && phone) {
        updateData.phone = phone;
      }
      if (!manualFields.includes("location") && location) {
        updateData.location = location;
      }

      // Reactivate if was terminated but now active in Google
      if (!isDeactivated && existingEmployee.status === "TERMINATED") {
        updateData.status = "ACTIVE";
        updateData.terminationDate = null;
      }

      await db.employee.update({
        where: { id: existingEmployee.id },
        data: updateData,
      });

      return { action: "updated" };
    }

    // Skip suspended users for new creation
    if (isDeactivated) {
      return { action: "skipped" };
    }

    // Create new employee
    await db.employee.create({
      data: {
        email,
        googleId: googleUser.id,
        fullName: googleUser.name?.fullName || email.split("@")[0],
        firstName: googleUser.name?.givenName || null,
        lastName: googleUser.name?.familyName || null,
        avatarUrl: googleUser.thumbnailPhotoUrl || null,
        phone: phone || null,
        location: location || null,
        status: "PENDING",
        isSyncedFromGoogle: true,
        lastSyncedAt: new Date(),
        tenantId: tenant.id,
        legalEntityId: tenant.defaultLegalEntityId,
        roleAssignments: {
          create: {
            role: "EMPLOYEE",
          },
        },
      },
    });

    return { action: "created" };
  } catch (error) {
    console.error(`[Sync] Error syncing user ${googleUser.primaryEmail}:`, error);
    return { 
      action: "skipped", 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}

// Main sync function for a tenant
export async function syncTenant(
  tenant: GoogleWorkspaceTenant,
  triggeredById?: string
): Promise<SyncResult> {
  console.log(`[Sync] Starting sync for tenant: ${tenant.name} (${tenant.domain})`);

  const result: SyncResult = {
    success: false,
    usersProcessed: 0,
    usersCreated: 0,
    usersUpdated: 0,
    usersDeactivated: 0,
    errors: [],
  };

  // Create sync run record
  const syncRun = await db.syncRun.create({
    data: {
      trigger: triggeredById ? "MANUAL" : "SCHEDULED",
      triggeredById,
      tenantId: tenant.id,
      status: "RUNNING",
      startedAt: new Date(),
    },
  });

  try {
    // Get Admin SDK client
    const admin = await getAdminClient(tenant);
    if (!admin) {
      throw new Error("Failed to create Admin SDK client");
    }

    // Fetch users from Google
    const googleUsers = await fetchGoogleUsers(admin, tenant);
    result.usersProcessed = googleUsers.length;

    // Get all existing employees for this tenant's domains
    const domains = [tenant.domain, ...(tenant.allowedDomains || [])];
    const existingEmployees = await db.employee.findMany({
      where: {
        OR: domains.map((domain) => ({
          email: { endsWith: `@${domain}` },
        })),
      },
    });

    const employeeMap = new Map(
      existingEmployees.map((e) => [e.email.toLowerCase(), e])
    );

    // Sync each user
    for (const googleUser of googleUsers) {
      const email = googleUser.primaryEmail.toLowerCase();
      const existingEmployee = employeeMap.get(email) || null;

      const syncResult = await syncUser(googleUser, tenant, existingEmployee);

      switch (syncResult.action) {
        case "created":
          result.usersCreated++;
          break;
        case "updated":
          result.usersUpdated++;
          break;
        case "deactivated":
          result.usersDeactivated++;
          break;
      }

      if (syncResult.error) {
        result.errors.push({ email, error: syncResult.error });
      }
    }

    // Check for users that exist in our DB but not in Google (deactivated)
    const googleEmails = new Set(googleUsers.map((u) => u.primaryEmail.toLowerCase()));
    for (const employee of existingEmployees) {
      if (
        !googleEmails.has(employee.email.toLowerCase()) &&
        employee.isSyncedFromGoogle &&
        employee.status !== "TERMINATED"
      ) {
        await db.employee.update({
          where: { id: employee.id },
          data: {
            status: "TERMINATED",
            terminationDate: new Date(),
            lastSyncedAt: new Date(),
          },
        });
        result.usersDeactivated++;
      }
    }

    result.success = true;

    // Update sync run
    await db.syncRun.update({
      where: { id: syncRun.id },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
        usersProcessed: result.usersProcessed,
        usersCreated: result.usersCreated,
        usersUpdated: result.usersUpdated,
        usersDeactivated: result.usersDeactivated,
        errorsCount: result.errors.length,
        notes: `Sync completed: ${result.usersProcessed} processed, ${result.usersCreated} created, ${result.usersUpdated} updated, ${result.usersDeactivated} deactivated`,
      },
    });

    // Update tenant last sync
    await db.googleWorkspaceTenant.update({
      where: { id: tenant.id },
      data: {
        lastSyncAt: new Date(),
        lastSyncStatus: "SUCCESS",
      },
    });

    // Create sync errors
    for (const error of result.errors) {
      await db.syncError.create({
        data: {
          syncRunId: syncRun.id,
          errorType: "SYNC_ERROR",
          errorMessage: error.error,
          errorDetails: { email: error.email },
        },
      });
    }

    console.log(`[Sync] Completed for ${tenant.name}: ${JSON.stringify(result)}`);
  } catch (error) {
    console.error(`[Sync] Failed for ${tenant.name}:`, error);

    await db.syncRun.update({
      where: { id: syncRun.id },
      data: {
        status: "FAILED",
        completedAt: new Date(),
        notes: error instanceof Error ? error.message : "Unknown error",
      },
    });

    await db.googleWorkspaceTenant.update({
      where: { id: tenant.id },
      data: {
        lastSyncAt: new Date(),
        lastSyncStatus: "FAILED",
      },
    });

    result.errors.push({ email: "SYSTEM", error: String(error) });
  }

  return result;
}

// Sync all active tenants
export async function syncAllTenants(triggeredById?: string): Promise<Map<string, SyncResult>> {
  const results = new Map<string, SyncResult>();

  const tenants = await db.googleWorkspaceTenant.findMany({
    where: {
      isActive: true,
      syncEnabled: true,
    },
  });

  console.log(`[Sync] Starting sync for ${tenants.length} tenants`);

  for (const tenant of tenants) {
    const result = await syncTenant(tenant, triggeredById);
    results.set(tenant.domain, result);
  }

  return results;
}

// Get sync status for all tenants
export async function getSyncStatus() {
  const tenants = await db.googleWorkspaceTenant.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      domain: true,
      syncEnabled: true,
      lastSyncAt: true,
      lastSyncStatus: true,
      _count: {
        select: {
          employees: true,
          syncRuns: true,
        },
      },
    },
  });

  const runningSync = await db.syncRun.findFirst({
    where: { status: { in: ["PENDING", "RUNNING"] } },
    include: {
      tenant: { select: { name: true, domain: true } },
    },
  });

  return {
    tenants,
    isRunning: !!runningSync,
    currentSync: runningSync,
  };
}
