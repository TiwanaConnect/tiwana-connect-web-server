import type { ElectionAuditAction, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

export function recordElectionAudit(input: {
  electionId: string;
  actorMemberId?: string;
  action: ElectionAuditAction;
  entityId?: string;
  metadata?: Record<string, unknown>;
}) {
  return prisma.electionAudit.create({
    data: {
      electionId: input.electionId,
      actorMemberId: input.actorMemberId,
      action: input.action,
      entityId: input.entityId,
      metadata: input.metadata as Prisma.InputJsonValue
    }
  });
}
