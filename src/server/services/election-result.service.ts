import { Prisma } from "@prisma/client";

import { API_ERROR_CODES, AppError } from "@/lib/api/errors";
import { decryptVotePayload, hashBallot } from "@/lib/crypto/election-crypto";
import { prisma } from "@/lib/db/prisma";

import { recordElectionAudit } from "./election-audit.service";
import { verifyBallotChain } from "./election-vote.service";
import { notifyMembers } from "./notification.service";

export async function startTally(input: { electionId: string; actorMemberId: string }) {
  const election = await prisma.election.findUnique({ where: { id: input.electionId }, include: { candidates: true, voters: true } });
  if (!election) throw new AppError(API_ERROR_CODES.NOT_FOUND, "Election not found.", 404);
  if (election.resultStatus === "PUBLISHED") throw new AppError(API_ERROR_CODES.CONFLICT, "Result is already published.", 409);
  await recordElectionAudit({ electionId: input.electionId, actorMemberId: input.actorMemberId, action: "TALLY_STARTED" });
  const chain = await verifyBallotChain(input.electionId);
  const ballots = await prisma.electionBallot.findMany({ where: { electionId: input.electionId }, orderBy: { hashChainIndex: "asc" } });
  const counts = new Map(election.candidates.map((candidate) => [candidate.id, 0]));
  let invalidBallots = chain.valid ? 0 : 1;
  for (const ballot of ballots) {
    try {
      const payload = decryptVotePayload(ballot);
      if (payload.electionId !== input.electionId || !counts.has(payload.candidateId)) {
        invalidBallots += 1;
      } else {
        counts.set(payload.candidateId, (counts.get(payload.candidateId) ?? 0) + 1);
      }
    } catch {
      invalidBallots += 1;
    }
  }
  const totalVotesCast = [...counts.values()].reduce((sum, count) => sum + count, 0);
  const rows = election.candidates.map((candidate) => ({
    candidateId: candidate.id,
    memberId: candidate.memberId,
    voteCount: counts.get(candidate.id) ?? 0,
    percentage: totalVotesCast > 0 ? Math.round(((counts.get(candidate.id) ?? 0) / totalVotesCast) * 10000) / 100 : 0
  })).sort((a, b) => b.voteCount - a.voteCount);
  const winner = rows[0];
  const resultHash = hashBallot(JSON.stringify(rows));
  const result = await prisma.electionResult.upsert({
    where: { electionId: input.electionId },
    update: {
      status: "FINALIZED",
      totalEligibleVoters: election.voters.filter((voter) => voter.status === "ELIGIBLE" || voter.status === "VOTED").length,
      totalVotesCast,
      invalidBallots,
      winnerCandidateId: winner?.candidateId,
      winnerMemberId: winner?.memberId,
      resultsJson: rows as Prisma.InputJsonValue,
      resultHash,
      finalizedAt: new Date(),
      finalizedBySystem: true
    },
    create: {
      electionId: input.electionId,
      status: "FINALIZED",
      totalEligibleVoters: election.voters.filter((voter) => voter.status === "ELIGIBLE" || voter.status === "VOTED").length,
      totalVotesCast,
      invalidBallots,
      winnerCandidateId: winner?.candidateId,
      winnerMemberId: winner?.memberId,
      resultsJson: rows as Prisma.InputJsonValue,
      resultHash,
      finalizedAt: new Date(),
      finalizedBySystem: true
    }
  });
  await prisma.election.update({ where: { id: input.electionId }, data: { status: "VOTING_CLOSED", resultStatus: "FINALIZED", winnerCandidateId: winner?.candidateId, winnerMemberId: winner?.memberId, isLocked: true, lockedAt: new Date() } });
  await recordElectionAudit({ electionId: input.electionId, action: "RESULT_FINALIZED", entityId: result.id, metadata: { resultHash } });
  return { result, ballotChain: chain };
}

export async function publishResult(input: { electionId: string; actorMemberId: string }) {
  const result = await prisma.electionResult.update({ where: { electionId: input.electionId }, data: { status: "PUBLISHED", publishedAt: new Date(), publishedById: input.actorMemberId } });
  const election = await prisma.election.update({ where: { id: input.electionId }, data: { status: "RESULT_ANNOUNCED", resultStatus: "PUBLISHED", resultAnnouncedAt: new Date() } });
  await recordElectionAudit({ electionId: input.electionId, actorMemberId: input.actorMemberId, action: "RESULT_PUBLISHED", entityId: result.id });
  const voters = await prisma.electionVoter.findMany({
    where: { electionId: input.electionId, status: { in: ["ELIGIBLE", "VOTED"] } },
    select: { memberId: true }
  });
  await notifyMembers({
    memberIds: voters.map((voter) => voter.memberId),
    type: "ELECTION_RESULT_ANNOUNCED",
    title: `Election result announced: ${election.title}`,
    body: "The election result has been published.",
    entityType: "ELECTION",
    entityId: election.id,
    actionLabel: "View result",
    actionUrl: `/elections/${election.id}/result`,
    priority: "HIGH",
    push: true
  });
  return { result };
}

export async function getTallyStatus(electionId: string) {
  const result = await prisma.electionResult.findUnique({ where: { electionId } });
  const ballotChain = await verifyBallotChain(electionId);
  return { result, ballotChain };
}

export async function getPublishedResult(electionId: string) {
  const result = await prisma.electionResult.findUnique({ where: { electionId } });
  if (!result || result.status !== "PUBLISHED") throw new AppError(API_ERROR_CODES.RESULT_NOT_PUBLISHED, "Result is not published.", 403);
  return { result };
}
