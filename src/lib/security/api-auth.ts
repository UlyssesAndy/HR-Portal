/**
 * API Authentication and Authorization Middleware
 */

import { NextRequest, NextResponse } from "next/server";
import { auth, AppRole } from "@/lib/auth";
import { isAdmin, isHR, isManager } from "@/types";
import { checkRateLimit, getClientIP, rateLimitHeaders, RATE_LIMITS, RateLimitConfig } from "./rate-limit";
import { db } from "@/lib/db";

export type ApiHandler = (
  request: NextRequest,
  context: { params: Record<string, string> }
) => Promise<NextResponse>;

interface ProtectedRouteOptions {
  /** Required roles (any match = access granted) */
  roles?: AppRole[];
  /** Require admin role */
  requireAdmin?: boolean;
  /** Require HR role (includes admin) */
  requireHR?: boolean;
  /** Require manager role (includes HR and admin) */
  requireManager?: boolean;
  /** Rate limit config */
  rateLimit?: RateLimitConfig;
  /** Audit log this action */
  auditAction?: string;
}

/**
 * Higher-order function to protect API routes
 */
export function withAuth(
  handler: ApiHandler,
  options: ProtectedRouteOptions = {}
): ApiHandler {
  return async (request, context) => {
    // Rate limiting check
    if (options.rateLimit) {
      const ip = getClientIP(request);
      const rateLimitResult = checkRateLimit(ip, options.rateLimit);
      
      if (!rateLimitResult.allowed) {
        return NextResponse.json(
          { error: "Too many requests. Please try again later." },
          { 
            status: 429,
            headers: rateLimitHeaders(rateLimitResult),
          }
        );
      }
    }

    // Authentication check
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const user = session.user;

    // Role-based authorization
    if (options.requireAdmin && !isAdmin(user as any)) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    if (options.requireHR && !isHR(user as any)) {
      return NextResponse.json(
        { error: "HR access required" },
        { status: 403 }
      );
    }

    if (options.requireManager && !isManager(user as any)) {
      return NextResponse.json(
        { error: "Manager access required" },
        { status: 403 }
      );
    }

    if (options.roles && options.roles.length > 0) {
      const hasRequiredRole = options.roles.some(role => 
        user.roles?.includes(role)
      );
      
      if (!hasRequiredRole) {
        return NextResponse.json(
          { error: "Insufficient permissions" },
          { status: 403 }
        );
      }
    }

    // Audit logging for sensitive operations
    if (options.auditAction) {
      try {
        const employee = await db.employee.findFirst({
          where: { email: user.email },
          select: { id: true },
        });

        if (employee) {
          await db.auditEvent.create({
            data: {
              actorId: employee.id,
              actorEmail: user.email!,
              action: options.auditAction,
              resourceType: "api",
              resourceId: request.url,
              metadata: {
                method: request.method,
                path: new URL(request.url).pathname,
                ip: getClientIP(request),
              },
            },
          });
        }
      } catch (error) {
        console.error("Failed to create audit log:", error);
        // Don't fail the request due to audit logging failure
      }
    }

    // Execute the handler
    return handler(request, context);
  };
}

/**
 * Pre-configured middleware variants
 */
export const withAdminAuth = (handler: ApiHandler, auditAction?: string) =>
  withAuth(handler, { 
    requireAdmin: true, 
    rateLimit: RATE_LIMITS.admin,
    auditAction,
  });

export const withHRAuth = (handler: ApiHandler, auditAction?: string) =>
  withAuth(handler, { 
    requireHR: true, 
    rateLimit: RATE_LIMITS.admin,
    auditAction,
  });

export const withManagerAuth = (handler: ApiHandler) =>
  withAuth(handler, { 
    requireManager: true, 
    rateLimit: RATE_LIMITS.api,
  });

export const withApiAuth = (handler: ApiHandler) =>
  withAuth(handler, { 
    rateLimit: RATE_LIMITS.api,
  });

export const withHeavyAuth = (handler: ApiHandler, auditAction?: string) =>
  withAuth(handler, { 
    requireHR: true, 
    rateLimit: RATE_LIMITS.heavy,
    auditAction,
  });
