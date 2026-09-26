import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export async function audit(
  userId: string | undefined,
  action: "CREATE" | "UPDATE" | "DELETE" | "REINDEX" | "ROLE_CHANGE" | "UPLOAD",
  entity: string,
  entityId?: string,
  details?: Prisma.InputJsonValue,
) {
  try {
    await prisma.auditLog.create({ data: { userId, action, entity, entityId, details } });
  } catch (e) {
    console.error("audit log failed", e);
  }
}
