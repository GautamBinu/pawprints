import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/client/client";

const connectionString = process.env.DATABASE_URL;

// Prevent multiple instances of Prisma Client in development
const globalForPrisma = global as unknown as { prismaNew: PrismaClient };

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

export const prisma =
  globalForPrisma.prismaNew ||
  new PrismaClient({
    adapter,
    log: ["query"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prismaNew = prisma;
