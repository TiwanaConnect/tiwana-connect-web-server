import { API_ERROR_CODES, AppError } from "@/lib/api/errors";
import { encryptVotePayload, generateReceiptCode, hashBallot, randomNonce } from "@/lib/crypto/election-crypto";
import { prisma } from "@/lib/db/prisma";
import { currentPhase } from "@/server/dto/election.dto";

import { recordElectionAudit } from "./election-audit.service";
import { notifyMembers } from "./notification.service";

export async function castVote(input: { electionId: string; memberId: string; candidateId: string }) {
  const election = await prisma.election.findUnique({ where: { id: input.electionId } });
  if (!election || election.deletedAt) throw new AppError(API_ERROR_CODES.NOT_FOUND, "Election not found.", 404);
  if (currentPhase(election) !== "VOTING_OPEN") throw new AppError(API_ERROR_CODES.FORBIDDEN, "Voting is not open.", 403);
  const candidate = await prisma.electionCandidate.findFirst({ where: { id: input.candidateId, electionId: input.electionId, status: "ANNOUNCED" } });
  if (!candidate) throw new AppError(API_ERROR_CODES.VALIDATION_ERROR, "Candidate is not valid for this election.", 400);
  const voter = await prisma.electionVoter.findUnique({ where: { electionId_memberId: { electionId: input.electionId, memberId: input.memberId } } });
  if (!voter || voter.status !== "ELIGIBLE") throw new AppError(API_ERROR_CODES.FORBIDDEN, "You are not eligible to vote.", 403);
  if (voter.hasVoted) throw new AppError(API_ERROR_CODES.CONFLICT, "You have already voted.", 409);

  const now = new Date();
  const payload = { electionId: input.electionId, candidateId: input.candidateId, nonce: randomNonce(), castAt: now.toISOString() };
  const encrypted = encryptVotePayload(payload);
  const receiptCode = generateReceiptCode();
  const result = await prisma.$transaction(async (tx) => {
    const latest = await tx.electionBallot.findFirst({ where: { electionId: input.electionId }, orderBy: { hashChainIndex: "desc" } });
    const hashChainIndex = (latest?.hashChainIndex ?? 0) + 1;
    const previousBallotHash = latest?.ballotHash ?? null;
    const ballotHash = hashBallot(`${encrypted.encryptedPayload}.${encrypted.iv}.${encrypted.authTag}.${previousBallotHash ?? ""}.${hashChainIndex}.${input.electionId}`);
    const ballot = await tx.electionBallot.create({ data: { electionId: input.electionId, ...encrypted, ballotHash, previousBallotHash, hashChainIndex, castAt: now } });
    const receiptHash = hashBallot(`${receiptCode}.${ballotHash}.${input.electionId}`);
    await tx.electionVoter.update({ where: { id: voter.id }, data: { hasVoted: true, status: "VOTED", votedAt: now, receiptHash, receiptCode } });
    await tx.electionAudit.create({ data: { electionId: input.electionId, actorMemberId: input.memberId, action: "VOTE_CAST", entityId: ballot.id, metadata: { ballotHash, receiptHash } } });
    return { receiptCode, receiptHash };
  });
  return { ...result, message: "Your vote has been submitted confidentially." };
}

export async function verifyBallotChain(electionId: string): Promise<{ valid: boolean; brokenAtIndex?: number }> {
  const ballots = await prisma.electionBallot.findMany({ where: { electionId }, orderBy: { hashChainIndex: "asc" } });
  let previous: string | null = null;
  for (const ballot of ballots) {
    const expected = hashBallot(`${ballot.encryptedPayload}.${ballot.iv}.${ballot.authTag}.${previous ?? ""}.${ballot.hashChainIndex}.${electionId}`);
    if (ballot.previousBallotHash !== previous || ballot.ballotHash !== expected) return { valid: false, brokenAtIndex: ballot.hashChainIndex };
    previous = ballot.ballotHash;
  }
  return { valid: true };
}

export async function getVoteReceipt(input: { electionId: string; memberId: string }) {
  const voter = await prisma.electionVoter.findUnique({ where: { electionId_memberId: { electionId: input.electionId, memberId: input.memberId } } });
  const chain = voter?.hasVoted ? await verifyBallotChain(input.electionId) : null;
  return { hasVoted: voter?.hasVoted ?? false, receiptCode: voter?.receiptCode ?? null, receiptHash: voter?.receiptHash ?? null, includedInBallotChain: chain?.valid ?? null };
}

export async function openVoting(input: { electionId: string; actorMemberId: string }) {
  const existing = await prisma.election.findUnique({ where: { id: input.electionId } });
  if (!existing || existing.deletedAt) throw new AppError(API_ERROR_CODES.NOT_FOUND, "Election not found.", 404);
  if (!["ANNOUNCED", "NOMINATION_CLOSED"].includes(existing.status)) {
    throw new AppError(API_ERROR_CODES.CONFLICT, "Voting can only be opened after nominations are closed.", 409);
  }

  const election = await prisma.$transaction(async (tx) => {
    const electionRow = await tx.election.update({
      where: { id: input.electionId },
      data: { status: "VOTING_OPEN", updatedById: input.actorMemberId }
    });
    return electionRow;
  });
  await recordElectionAudit({ electionId: input.electionId, actorMemberId: input.actorMemberId, action: "VOTING_OPENED" });
  const voters = await prisma.electionVoter.findMany({
    where: { electionId: input.electionId, status: "ELIGIBLE" },
    select: { memberId: true }
  });
  await notifyMembers({
    memberIds: voters.map((voter) => voter.memberId),
    type: "ELECTION_VOTING_OPEN",
    title: `Voting is open: ${election.title}`,
    body: "You can now cast your vote.",
    entityType: "ELECTION",
    entityId: election.id,
    actionLabel: "Vote now",
    actionUrl: `/elections/${election.id}/vote`,
    priority: "URGENT",
    push: true
  });
  return { election };
}

export async function closeVoting(input: { electionId: string; actorMemberId: string }) {
  const existing = await prisma.election.findUnique({ where: { id: input.electionId } });
  if (!existing || existing.deletedAt) throw new AppError(API_ERROR_CODES.NOT_FOUND, "Election not found.", 404);
  if (existing.status !== "VOTING_OPEN") {
    throw new AppError(API_ERROR_CODES.CONFLICT, "Voting is not open.", 409);
  }

  const election = await prisma.$transaction(async (tx) => {
    const electionRow = await tx.election.update({
      where: { id: input.electionId },
      data: { status: "VOTING_CLOSED", updatedById: input.actorMemberId }
    });
    return electionRow;
  });
  await recordElectionAudit({ electionId: input.electionId, actorMemberId: input.actorMemberId, action: "VOTING_CLOSED" });
  return { election };
}
