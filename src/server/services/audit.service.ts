import type { AuditEntityType } from "@prisma/client";
import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";

type AuditInput = {
  actorMemberId?: string;
  action: string;
  entityType: AuditEntityType;
  entityId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
};

export async function recordAuditLog(input: AuditInput) {
  return prisma.auditLog.create({
    data: {
      actorMemberId: input.actorMemberId,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      metadata: input.metadata as Prisma.InputJsonValue,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent
    }
  });
}
