import { PrismaClient } from "@prisma/client";

// Extend global type for Next.js hot reloading
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Configure connection pool based on environment
const connectionPoolConfig = {
  // In production, use connection pooling with reasonable limits
  // Railway/PlanetScale/Supabase typically recommend 5-10 connections
  connection_limit: process.env.DATABASE_CONNECTION_LIMIT 
    ? parseInt(process.env.DATABASE_CONNECTION_LIMIT) 
    : (process.env.NODE_ENV === "production" ? 10 : 5),
  pool_timeout: 10, // seconds to wait for a connection
};

// Append pool config to DATABASE_URL if not already present
const getDatabaseUrl = (): string => {
  const baseUrl = process.env.DATABASE_URL || "";
  
  // Only add params if they're not already in the URL
  if (baseUrl && !baseUrl.includes("connection_limit")) {
    const separator = baseUrl.includes("?") ? "&" : "?";
    return `${baseUrl}${separator}connection_limit=${connectionPoolConfig.connection_limit}&pool_timeout=${connectionPoolConfig.pool_timeout}`;
  }
  
  return baseUrl;
};

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    // Use modified URL with connection pool settings
    datasources: {
      db: {
        url: getDatabaseUrl(),
      },
    },
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

// In development, preserve connection across hot reloads
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}

// Graceful shutdown handlers for production
if (process.env.NODE_ENV === "production") {
  process.on("beforeExit", async () => {
    await db.$disconnect();
  });
}

export default db;
