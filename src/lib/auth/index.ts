import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "@/lib/db";

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

declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    roles: AppRole[];
  }
}

// Build providers array dynamically
const providers: any[] = [];

// Add Google provider only if credentials are configured
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          prompt: "select_account",
          hd: process.env.ALLOWED_EMAIL_DOMAINS?.split(",")[0] || undefined,
        },
      },
    })
  );
}

// Add Credentials provider for email-based login
providers.push(
  Credentials({
    id: "email-login",
    name: "Email",
    credentials: {
      email: { label: "Email", type: "email", placeholder: "your@email.com" },
    },
    async authorize(credentials) {
      const email = credentials?.email as string;

      if (!email) {
        throw new Error("Email is required");
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new Error("Invalid email format");
      }

      const normalizedEmail = email.toLowerCase().trim();
      const userDomain = normalizedEmail.split("@")[1];
      const allowedDomains = (process.env.ALLOWED_EMAIL_DOMAINS || "")
        .split(",")
        .map((d) => d.trim().toLowerCase());

      // Check if domain is allowed OR user was invited
      let isAllowed = allowedDomains.includes(userDomain);

      if (!isAllowed) {
        // Check for existing employee or invitation
        const existingEmployee = await db.employee.findUnique({
          where: { email: normalizedEmail },
        });

        if (!existingEmployee) {
          const invitation = await db.invitation.findFirst({
            where: {
              email: normalizedEmail,
              status: "PENDING",
              expiresAt: { gt: new Date() },
            },
          });

          if (!invitation) {
            throw new Error(
              "Access denied: email domain not allowed and no invitation found"
            );
          }
        }
        isAllowed = true;
      }

      // Find or create employee
      let employee = await db.employee.findUnique({
        where: { email: normalizedEmail },
      });

      if (!employee) {
        // Create new employee with PENDING status
        employee = await db.employee.create({
          data: {
            email: normalizedEmail,
            fullName: normalizedEmail.split("@")[0],
            status: "PENDING",
            isSyncedFromGoogle: false,
            isExternal: !allowedDomains.includes(userDomain),
            roleAssignments: {
              create: {
                role: "EMPLOYEE",
              },
            },
          },
        });

        // Mark invitation as accepted if exists
        await db.invitation.updateMany({
          where: {
            email: normalizedEmail,
            status: "PENDING",
          },
          data: {
            status: "ACCEPTED",
            acceptedAt: new Date(),
          },
        });
      }

      // Return user object for NextAuth
      return {
        id: employee.id,
        email: employee.email,
        name: employee.fullName,
        image: employee.avatarUrl,
      };
    },
  })
);

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(db) as any,
  providers,
  trustHost: true,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      // Credentials provider already handles everything
      if (account?.provider === "email-login") {
        return true;
      }

      // Google OAuth flow
      if (!user.email) return false;

      const allowedDomains = (process.env.ALLOWED_EMAIL_DOMAINS || "")
        .split(",")
        .map((d) => d.trim().toLowerCase());

      const userDomain = user.email.split("@")[1]?.toLowerCase();

      // Allow if domain matches OR if user already exists (external invited user)
      if (!allowedDomains.includes(userDomain)) {
        const existingEmployee = await db.employee.findUnique({
          where: { email: user.email.toLowerCase() },
        });

        if (!existingEmployee) {
          const invitation = await db.invitation.findFirst({
            where: {
              email: user.email.toLowerCase(),
              status: "PENDING",
              expiresAt: { gt: new Date() },
            },
          });

          if (!invitation) {
            console.log(
              `Access denied for email: ${user.email} - domain not allowed and no invitation`
            );
            return false;
          }
        }
      }

      // JIT Provisioning: Create employee if doesn't exist
      const existingEmployee = await db.employee.findUnique({
        where: { email: user.email.toLowerCase() },
      });

      if (!existingEmployee) {
        await db.employee.create({
          data: {
            email: user.email.toLowerCase(),
            fullName: user.name || user.email.split("@")[0],
            firstName: (profile?.given_name as string) || null,
            lastName: (profile?.family_name as string) || null,
            avatarUrl: user.image || null,
            googleId: account?.providerAccountId || null,
            status: "PENDING",
            isSyncedFromGoogle: true,
            lastSyncedAt: new Date(),
            isExternal: !allowedDomains.includes(userDomain),
            roleAssignments: {
              create: {
                role: "EMPLOYEE",
              },
            },
          },
        });

        await db.invitation.updateMany({
          where: {
            email: user.email.toLowerCase(),
            status: "PENDING",
          },
          data: {
            status: "ACCEPTED",
            acceptedAt: new Date(),
          },
        });
      } else {
        await db.employee.update({
          where: { id: existingEmployee.id },
          data: {
            avatarUrl: user.image || existingEmployee.avatarUrl,
            lastSyncedAt: new Date(),
          },
        });
      }

      return true;
    },

    async jwt({ token, user }) {
      // If this is a new sign-in via NextAuth provider
      if (user) {
        const employee = await db.employee.findUnique({
          where: { email: user.email!.toLowerCase() },
          include: {
            roleAssignments: {
              where: {
                OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
              },
            },
          },
        });

        if (employee) {
          token.id = employee.id;
          token.roles = employee.roleAssignments.map(
            (ra: { role: AppRole }) => ra.role
          );
        }
      }
      
      // Ensure token always has roles array (for custom login tokens)
      if (!token.roles && token.id) {
        token.roles = token.roles || ["EMPLOYEE"];
      }
      
      return token;
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
