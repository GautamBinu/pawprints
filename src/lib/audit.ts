import { prisma } from "@/lib/prisma";

export async function logAction(
  action: string,
  details?: Record<string, any>,
  userId?: string,
) {
  try {
    await prisma.auditLog.create({
      data: {
        action,
        details: details ? JSON.stringify(details) : undefined,
        userId: userId || undefined,
      },
    });
  } catch (error) {
    console.error("Failed to create audit log:", error);
  }
}
