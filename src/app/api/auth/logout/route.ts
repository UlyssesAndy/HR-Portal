import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    // Clear the session cookie
    const cookieStore = await cookies();
    const token = cookieStore.get("authjs.session-token")?.value;
    
    // Invalidate session in database if exists
    if (session?.user?.id && token) {
      const tokenPrefix = token.slice(0, 64);
      
      try {
        // Find credentials
        const credentials = await db.userCredentials.findUnique({
          where: { employeeId: session.user.id },
        });
        
        if (credentials) {
          // Mark session as revoked
          await db.userSession.updateMany({
            where: {
              credentialsId: credentials.id,
              sessionToken: tokenPrefix,
              isActive: true,
            },
            data: {
              isActive: false,
              revokedAt: new Date(),
            },
          });
        }
        
        // Audit log
        await db.auditEvent.create({
          data: {
            actorId: session.user.id,
            actorEmail: session.user.email,
            action: "auth.logout",
            resourceType: "employee",
            resourceId: session.user.id,
          },
        });
      } catch (e) {
        // Ignore DB errors during logout
        console.error("Logout DB error:", e);
      }
    }
    
    // Delete all auth cookies
    cookieStore.delete("authjs.session-token");
    cookieStore.delete("authjs.csrf-token");
    cookieStore.delete("authjs.callback-url");
    
    // Redirect to login with cache-busting headers
    const response = NextResponse.redirect(new URL("/login", request.url));
    
    // Prevent browser from caching authenticated pages
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");
    response.headers.set("Clear-Site-Data", '"cache", "cookies", "storage"');
    
    return response;
  } catch (error) {
    console.error("Logout error:", error);
    // Even on error, redirect to login
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
    return response;
  }
}

// Also handle GET for direct link logout
export async function GET(request: NextRequest) {
  return POST(request);
}
