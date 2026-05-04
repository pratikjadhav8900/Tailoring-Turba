import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : [],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// Helper: run a DB call with automatic retry on connection error (Neon cold starts)
export async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 3,
  delayMs = 1500
): Promise<T> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      const isConnErr =
        err?.message?.includes("Can't reach database") ||
        err?.message?.includes("Closed") ||
        err?.message?.includes("socket") ||
        err?.code === "P1001";
      if (isConnErr && attempt < retries) {
        console.warn(`[DB] Connection failed, retrying (${attempt}/${retries})...`);
        await new Promise((r) => setTimeout(r, delayMs * attempt));
      } else {
        throw err;
      }
    }
  }
  throw new Error("DB: Max retries reached");
}
