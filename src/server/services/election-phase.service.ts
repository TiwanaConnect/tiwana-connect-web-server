import type { ElectionPhaseType } from "@prisma/client";

import { API_ERROR_CODES, AppError } from "@/lib/api/errors";
import { prisma } from "@/lib/db/prisma";
import { currentPhase } from "@/server/dto/election.dto";

import { recordElectionAudit } from "./election-audit.service";

export function getCurrentElectionPhase(election: Parameters<typeof currentPhase>[0]) {
  return currentPhase(election);
}

export async function syncElectionStatusFromTimeline(electionId: string) {
  const election = await prisma.election.findUnique({ where: { id: electionId } });
  if (!election) throw new AppError(API_ERROR_CODES.NOT_FOUND, "Election not found.", 404);
  return election;
}

export async function syncElectionStatusesFromTimeline(electionIds: string[]) {
  void electionIds;
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
  const checkpointDate = input.newStartsAt ? new Date(input.newStartsAt) : null;
  if (!checkpointDate || Number.isNaN(checkpointDate.getTime())) {
    throw new AppError(API_ERROR_CODES.VALIDATION_ERROR, "Timeline date is required.", 400);
  }

  const rootDateData =
    input.phaseType === "NOMINATION_OPEN" ? { nominationStartAt: checkpointDate } :
    input.phaseType === "NOMINATION_CLOSED" ? { nominationEndAt: checkpointDate } :
    input.phaseType === "VOTING_OPEN" ? { votingStartAt: checkpointDate } :
    input.phaseType === "VOTING_CLOSED" ? { votingEndAt: checkpointDate } :
    {};
  const nextDates = {
    nominationStartAt: input.phaseType === "NOMINATION_OPEN" ? checkpointDate : election.nominationStartAt,
    nominationEndAt: input.phaseType === "NOMINATION_CLOSED" ? checkpointDate : election.nominationEndAt,
    votingStartAt: input.phaseType === "VOTING_OPEN" ? checkpointDate : election.votingStartAt,
    votingEndAt: input.phaseType === "VOTING_CLOSED" ? checkpointDate : election.votingEndAt
  };
  if (
    nextDates.nominationEndAt <= nextDates.nominationStartAt ||
    nextDates.votingStartAt < nextDates.nominationEndAt ||
    nextDates.votingEndAt <= nextDates.votingStartAt
  ) {
    throw new AppError(API_ERROR_CODES.VALIDATION_ERROR, "Election timeline dates are not in a valid order.", 400);
  }

  const phase = await prisma.$transaction(async (tx) => {
    const updated = await tx.electionPhase.update({
      where: { electionId_type: { electionId: input.electionId, type: input.phaseType } },
      data: {
        startsAt: checkpointDate,
        extensionCount: { increment: 1 },
        metadata: { reason: input.reason, extendedAt: new Date().toISOString() }
      }
    });

    if (input.phaseType === "NOMINATION_CLOSED") {
      await tx.electionPhase.updateMany({ where: { electionId: input.electionId, type: "NOMINATION_OPEN" }, data: { endsAt: checkpointDate } });
    }
    if (input.phaseType === "VOTING_OPEN") {
      await tx.electionPhase.updateMany({ where: { electionId: input.electionId, type: "NOMINATION_CLOSED" }, data: { endsAt: checkpointDate } });
    }
    if (input.phaseType === "VOTING_CLOSED") {
      await tx.electionPhase.updateMany({ where: { electionId: input.electionId, type: "VOTING_OPEN" }, data: { endsAt: checkpointDate } });
    }

    await tx.election.update({ where: { id: input.electionId }, data: rootDateData });
    return updated;
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
