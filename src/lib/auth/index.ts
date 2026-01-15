import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

// Role type (matches Prisma enum after generation)
export type AppRole = "EMPLOYEE" | "MANAGER" | "HR" | "PAYROLL_FINANCE" | "ADMIN";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      image?: string;
      roles: AppRole[];
    };
  }

  interface User {
    roles?: AppRole[];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    roles: AppRole[];
  }
}

// Build providers array
const providers: any[] = [];

// Credentials provider for password-based login
providers.push(
  Credentials({
    id: "credentials",
    name: "Password",
    credentials: {
      email: { label: "Email", type: "email", placeholder: "your@email.com" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      const email = credentials?.email as string;
      const password = credentials?.password as string;

      if (!email || !password) {
        throw new Error("Email and password are required");
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new Error("Invalid email format");
      }

      const normalizedEmail = email.toLowerCase().trim();

      // Find employee with credentials
      const employee = await db.employee.findUnique({
        where: { email: normalizedEmail },
        include: {
          credentials: true,
          roleAssignments: {
            where: {
              OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
            },
          },
        },
      });

      if (!employee || !employee.credentials?.passwordHash) {
        // Log failed attempt for unknown email
        await db.auditEvent.create({
          data: {
            actorId: null,
            actorEmail: normalizedEmail,
            action: "auth.login_failed",
            resourceType: "employee",
            resourceId: null,
            metadata: {
              reason: "invalid_credentials",
              email: normalizedEmail,
            },
          },
        });
        
        throw new Error("Invalid email or password");
      }

      // Check if account is locked
      if (
        employee.credentials.lockedUntil &&
        employee.credentials.lockedUntil > new Date()
      ) {
        throw new Error(
          `Account locked. Try again after ${employee.credentials.lockedUntil.toLocaleTimeString()}`
        );
      }

      // Verify password
      const isValid = await bcrypt.compare(
        password,
        employee.credentials.passwordHash
      );

      if (!isValid) {
        // Increment failed attempts
        const failedAttempts = employee.credentials.failedAttempts + 1;
        const shouldLock = failedAttempts >= 5;

        await db.userCredentials.update({
          where: { id: employee.credentials.id },
          data: {
            failedAttempts,
            lockedUntil: shouldLock
              ? new Date(Date.now() + 15 * 60 * 1000) // 15 minutes
              : null,
          },
        });

        // Log failed attempt
        await db.auditEvent.create({
          data: {
            actorId: employee.id,
            actorEmail: email,
            action: "auth.login_failed",
            resourceType: "employee",
            resourceId: employee.id,
            metadata: {
              reason: "invalid_password",
              failedAttempts,
              locked: shouldLock,
            },
          },
        });

        if (shouldLock) {
          throw new Error(
            "Too many failed attempts. Account locked for 15 minutes."
          );
        }

        throw new Error("Invalid email or password");
      }

      // Reset failed attempts on successful login
      await db.userCredentials.update({
        where: { id: employee.credentials.id },
        data: {
          failedAttempts: 0,
          lockedUntil: null,
          lastLoginAt: new Date(),
        },
      });

      // Return user object with roles
      return {
        id: employee.id,
        email: employee.email,
        name: employee.fullName,
        image: employee.avatarUrl,
        roles: employee.roleAssignments.map((ra) => ra.role),
      };
    },
  })
);

export const { handlers, signIn, signOut, auth } = NextAuth({
  // NOTE: No adapter needed for JWT strategy
  // PrismaAdapter can load sensitive data into tokens
  providers,
  trustHost: true,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  jwt: {
    // Use JWT signing instead of encryption to reduce token size
    // JWE (encryption) creates tokens 3-4x larger than JWS (signing)
    encode: async ({ token, secret }) => {
      const { encode: jwtEncode } = await import("next-auth/jwt");
      return jwtEncode({ token, secret, salt: "authjs.session-token" });
    },
    decode: async ({ token, secret }) => {
      const { decode: jwtDecode } = await import("next-auth/jwt");
      return jwtDecode({ token, secret, salt: "authjs.session-token" });
    },
  },
  cookies: {
    sessionToken: {
      name: `authjs.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      }
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
    signOut: "/login",
  },
  callbacks: {
    async signIn({ user }) {
      // Block TERMINATED users from logging in
      if (user.email) {
        const employee = await db.employee.findUnique({
          where: { email: user.email.toLowerCase() },
          select: { status: true },
        });

        if (employee && employee.status === "TERMINATED") {
          return false; // Deny login
        }
      }
      
      return true;
    },

    async jwt({ token, user }) {
      // CRITICAL: Only store minimal user data in JWT
      // Never store credentials, secrets, or sensitive data
      
      if (user) {
        // Only store ID and roles on initial login
        token.id = user.id!;
        token.roles = user.roles || ["EMPLOYEE"];
      }
      
      // Ensure we have id field for existing tokens
      if (!token.id && token.sub) {
        token.id = token.sub as string;
      }
      
      // Ensure roles array exists
      if (!token.roles) {
        token.roles = ["EMPLOYEE"];
      }
      
      // CRITICAL: Strip any credentials or sensitive data that might have been added
      // This prevents totpSecret, backupCodes, passwordHash from ending up in the token
      const cleanToken = {
        sub: token.sub,
        id: token.id,
        email: token.email,
        name: token.name,
        picture: token.picture,
        roles: token.roles,
        iat: token.iat,
        exp: token.exp,
        jti: token.jti,
      };
      
      // Debug: Log token size
      if (process.env.NODE_ENV === "production") {
        const tokenSize = JSON.stringify(cleanToken).length;
        if (tokenSize > 1000) {
          console.warn(`[Auth] Large JWT token detected: ${tokenSize} bytes`, {
            email: token.email,
            hasExtraFields: Object.keys(token).filter(k => ![
              'sub', 'id', 'email', 'name', 'picture', 'roles', 'iat', 'exp', 'jti'
            ].includes(k)),
          });
        }
      }
      
      return cleanToken as any;
    },

    async session({ session, token }) {
      if (token) {
        session.user.id = (token.id || token.sub) as string;
        session.user.roles = (token.roles as AppRole[]) || ["EMPLOYEE"];
        session.user.email = token.email as string;
        session.user.name = token.name as string;
      }
      return session;
    },
  },
  events: {
    async signIn({ user, account }) {
      if (user.email) {
        const employee = await db.employee.findUnique({
          where: { email: user.email.toLowerCase() },
        });

        if (employee) {
          await db.auditEvent.create({
            data: {
              actorId: employee.id,
              actorEmail: user.email,
              action: "auth.login",
              resourceType: "employee",
              resourceId: employee.id,
              metadata: {
                provider: account?.provider,
              },
            },
          });
        }
      }
    },
  },
});
