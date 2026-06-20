import type { ElectionPhaseType } from "@prisma/client";

import { API_ERROR_CODES, AppError } from "@/lib/api/errors";
import { prisma } from "@/lib/db/prisma";
import { currentPhase } from "@/server/dto/election.dto";

import { recordElectionAudit } from "./election-audit.service";

export function getCurrentElectionPhase(election: Parameters<typeof currentPhase>[0], now = new Date()) {
  return currentPhase(election, now);
}

export async function syncElectionStatusFromTimeline(electionId: string) {
  const election = await prisma.election.findUnique({ where: { id: electionId } });
  if (!election) throw new AppError(API_ERROR_CODES.NOT_FOUND, "Election not found.", 404);
  const status = currentPhase(election) as typeof election.status;
  return prisma.election.update({ where: { id: electionId }, data: { status } });
}

export async function extendElectionPhase(input: {
  electionId: string;
  phaseType: ElectionPhaseType;
  newStartsAt?: string | null;
  newEndsAt?: string | null;
  reason: string;
  actorMemberId: string;
}) {
  const election = await prisma.election.findUnique({ where: { id: input.electionId } });
  if (!election || election.deletedAt) throw new AppError(API_ERROR_CODES.NOT_FOUND, "Election not found.", 404);
  if (election.status === "COMPLETED") {
    throw new AppError(API_ERROR_CODES.CONFLICT, "Completed elections cannot be extended.", 409);
  }
  const phase = await prisma.electionPhase.update({
    where: { electionId_type: { electionId: input.electionId, type: input.phaseType } },
    data: {
      startsAt: input.newStartsAt === undefined ? undefined : input.newStartsAt ? new Date(input.newStartsAt) : null,
      endsAt: input.newEndsAt === undefined ? undefined : input.newEndsAt ? new Date(input.newEndsAt) : null,
      extensionCount: { increment: 1 },
      metadata: { reason: input.reason, extendedAt: new Date().toISOString() }
    }
  });
  await recordElectionAudit({ electionId: input.electionId, actorMemberId: input.actorMemberId, action: "PHASE_EXTENDED", entityId: phase.id, metadata: { phaseType: input.phaseType, reason: input.reason } });
  return { phase };
}

export async function completeElectionPhase(input: { electionId: string; phaseType: ElectionPhaseType; actorMemberId: string }) {
  const phase = await prisma.electionPhase.update({
    where: { electionId_type: { electionId: input.electionId, type: input.phaseType } },
    data: { isCompleted: true, completedAt: new Date(), isActive: false }
  });
  return { phase };
}
