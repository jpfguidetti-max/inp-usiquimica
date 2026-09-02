import { PrismaClient } from "@prisma/client";

// Standard Next.js singleton pattern to avoid exhausting the connection pool
// with a new PrismaClient per hot-reload / per serverless invocation.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
