import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

type AuditInput = {
  action: string;
  actorId?: string | null;
  targetType?: "user" | "giveaway" | "entry";
  targetId?: string;
  ip?: string;
  metadata?: Prisma.InputJsonValue;
};

/** Records a moderation-relevant event. Never throws (logging must not break the request). */
export async function audit(input: AuditInput) {
  try {
    await prisma.auditLog.create({
      data: {
        action: input.action,
        actorId: input.actorId ?? null,
        targetType: input.targetType,
        targetId: input.targetId,
        ip: input.ip,
        metadata: input.metadata,
      },
    });
  } catch (e) {
    console.error("audit log failed", e);
  }
}
