import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { headers } from "next/headers";

// Jira Webhook Secret (should be in env vars)
const JIRA_WEBHOOK_SECRET = process.env.JIRA_WEBHOOK_SECRET || "demo-secret";

interface JiraWebhookPayload {
  webhookEvent: string;
  issue?: {
    key: string;
    fields?: {
      summary?: string;
      status?: { name: string };
      assignee?: { emailAddress: string; displayName: string };
      customfield_email?: string; // Custom field for employee email
      customfield_start_date?: string;
      issuetype?: { name: string };
    };
  };
  user?: {
    emailAddress: string;
    displayName: string;
  };
}

// POST /api/webhooks/jira - Handle Jira webhook events
export async function POST(request: NextRequest) {
  try {
    const headersList = await headers();
    
    // Validate webhook signature (simplified for demo)
    const signature = headersList.get("x-hub-signature") || headersList.get("x-jira-signature");
    
    // In production, validate HMAC signature
    // For demo, we'll accept requests with the correct secret header or skip validation
    const authHeader = headersList.get("authorization");
    if (JIRA_WEBHOOK_SECRET !== "demo-secret" && authHeader !== `Bearer ${JIRA_WEBHOOK_SECRET}`) {
      console.warn("[Jira Webhook] Invalid or missing authorization");
      // Don't reject in demo mode
    }

    const payload: JiraWebhookPayload = await request.json();
    
    // Check idempotency - use webhookEvent + issue key as unique ID
    const webhookId = `${payload.webhookEvent}-${payload.issue?.key || Date.now()}`;
    
    const existingEvent = await db.jiraWebhookEvent.findUnique({
      where: { webhookId },
    });

    if (existingEvent) {
      // Idempotent - already processed
      return NextResponse.json({ status: "already_processed" }, { status: 200 });
    }

    // Store webhook event
    await db.jiraWebhookEvent.create({
      data: {
        webhookId,
        eventType: payload.webhookEvent,
        issueKey: payload.issue?.key,
        payload: payload as any,
        status: "processing",
      },
    });

    // Process the event
    const result = await processJiraEvent(payload);

    // Update event status
    await db.jiraWebhookEvent.update({
      where: { webhookId },
      data: { status: result.status },
    });

    return NextResponse.json(result, { status: 202 });
  } catch (error) {
    console.error("[Jira Webhook] Error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

async function processJiraEvent(payload: JiraWebhookPayload): Promise<{ status: string; action?: string; details?: any }> {
  const { webhookEvent, issue, user } = payload;

  // Handle different event types
  switch (webhookEvent) {
    case "jira:issue_created":
    case "jira:issue_updated": {
      const issueType = issue?.fields?.issuetype?.name?.toLowerCase();
      
      // Check if it's an onboarding/offboarding issue
      if (issueType === "onboarding" || issue?.fields?.summary?.toLowerCase().includes("onboarding")) {
        return handleOnboardingEvent(payload);
      }
      
      if (issueType === "offboarding" || issue?.fields?.summary?.toLowerCase().includes("offboarding")) {
        return handleOffboardingEvent(payload);
      }

      // Generic issue - might contain external user
      if (user?.emailAddress && !user.emailAddress.includes("@company.com")) {
        return handleExternalUserEvent(payload);
      }

      return { status: "processed", action: "ignored", details: "Not a relevant issue type" };
    }

    case "comment_created":
    case "comment_updated": {
      // Check for external user in comments
      if (user?.emailAddress && !user.emailAddress.includes("@company.com")) {
        return handleExternalUserEvent(payload);
      }
      return { status: "processed", action: "ignored" };
    }

    default:
      return { status: "processed", action: "ignored", details: `Unknown event: ${webhookEvent}` };
  }
}

async function handleOnboardingEvent(payload: JiraWebhookPayload): Promise<{ status: string; action: string; details?: any }> {
  const { issue } = payload;
  
  const email = issue?.fields?.customfield_email || 
                issue?.fields?.assignee?.emailAddress;
  const fullName = issue?.fields?.assignee?.displayName || "New Employee";
  const startDate = issue?.fields?.customfield_start_date;

  if (!email) {
    // Create problem record for missing data
    await db.problemRecord.create({
      data: {
        problemType: "ONBOARDING_MISSING_EMAIL",
        description: `Onboarding issue ${issue?.key} is missing employee email`,
        source: "JIRA",
        details: { issueKey: issue?.key, summary: issue?.fields?.summary },
      },
    });

    return { status: "processed", action: "problem_created", details: "Missing email in onboarding issue" };
  }

  // Check if employee already exists
  const existing = await db.employee.findUnique({ where: { email } });

  if (existing) {
    return { status: "processed", action: "skipped", details: "Employee already exists" };
  }

  // Check if it's an external email (non-corporate domain)
  const corporateDomains = ["company.com", "corp.company.com"]; // Configure as needed
  const emailDomain = email.split("@")[1];
  const isExternal = !corporateDomains.some(d => emailDomain === d || emailDomain?.endsWith(`.${d}`));

  if (isExternal) {
    // Create pending access record
    await db.pendingAccess.create({
      data: {
        email,
        fullName,
        source: "JIRA",
        sourceReference: issue?.key,
        status: "PENDING",
      },
    });

    await db.auditEvent.create({
      data: {
        action: "pending_access.created",
        resourceType: "PendingAccess",
        metadata: { source: "jira", issueKey: issue?.key, email },
      },
    });

    return { status: "processed", action: "pending_access_created", details: { email, issueKey: issue?.key } };
  }

  // Create new employee (pending status)
  const employee = await db.employee.create({
    data: {
      email,
      fullName,
      status: "PENDING",
      startDate: startDate ? new Date(startDate) : null,
    },
  });

  await db.auditEvent.create({
    data: {
      action: "employee.created",
      resourceType: "Employee",
      resourceId: employee.id,
      metadata: { source: "jira", issueKey: issue?.key },
    },
  });

  return { status: "processed", action: "employee_created", details: { employeeId: employee.id, email } };
}

async function handleOffboardingEvent(payload: JiraWebhookPayload): Promise<{ status: string; action: string; details?: any }> {
  const { issue } = payload;
  
  const email = issue?.fields?.customfield_email || 
                issue?.fields?.assignee?.emailAddress;

  if (!email) {
    await db.problemRecord.create({
      data: {
        problemType: "OFFBOARDING_MISSING_EMAIL",
        description: `Offboarding issue ${issue?.key} is missing employee email`,
        source: "JIRA",
        details: { issueKey: issue?.key },
      },
    });

    return { status: "processed", action: "problem_created" };
  }

  const employee = await db.employee.findUnique({ where: { email } });

  if (!employee) {
    return { status: "processed", action: "skipped", details: "Employee not found" };
  }

  // Mark as terminated
  await db.employee.update({
    where: { id: employee.id },
    data: {
      status: "TERMINATED",
      terminationDate: new Date(),
    },
  });

  // Record history
  await db.employeeHistory.create({
    data: {
      employeeId: employee.id,
      fieldName: "status",
      oldValue: employee.status,
      newValue: "TERMINATED",
      changeSource: "JIRA",
      changeNote: `Offboarding via Jira issue ${issue?.key}`,
    },
  });

  await db.auditEvent.create({
    data: {
      action: "employee.terminated",
      resourceType: "Employee",
      resourceId: employee.id,
      metadata: { source: "jira", issueKey: issue?.key },
    },
  });

  return { status: "processed", action: "employee_terminated", details: { employeeId: employee.id } };
}

async function handleExternalUserEvent(payload: JiraWebhookPayload): Promise<{ status: string; action: string; details?: any }> {
  const email = payload.user?.emailAddress;
  const fullName = payload.user?.displayName;

  if (!email) {
    return { status: "processed", action: "skipped" };
  }

  // Check if already in pending access
  const existing = await db.pendingAccess.findUnique({ where: { email } });
  if (existing) {
    return { status: "processed", action: "skipped", details: "Already in pending access" };
  }

  // Check if already an employee
  const employee = await db.employee.findUnique({ where: { email } });
  if (employee) {
    return { status: "processed", action: "skipped", details: "Already an employee" };
  }

  // Create pending access
  await db.pendingAccess.create({
    data: {
      email,
      fullName,
      source: "JIRA",
      sourceReference: payload.issue?.key || "comment",
      status: "PENDING",
    },
  });

  await db.auditEvent.create({
    data: {
      action: "pending_access.created",
      resourceType: "PendingAccess",
      metadata: { source: "jira", email, reason: "external_user_interaction" },
    },
  });

  return { status: "processed", action: "pending_access_created", details: { email } };
}

// GET - Health check / webhook info
export async function GET() {
  return NextResponse.json({
    status: "ok",
    webhook: "jira",
    supported_events: [
      "jira:issue_created",
      "jira:issue_updated", 
      "comment_created",
      "comment_updated",
    ],
    description: "Handles onboarding/offboarding issues and external user detection",
  });
}
