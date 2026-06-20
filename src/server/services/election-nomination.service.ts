import { API_ERROR_CODES, AppError } from "@/lib/api/errors";
import { prisma } from "@/lib/db/prisma";
import { currentPhase } from "@/server/dto/election.dto";

import { recordElectionAudit } from "./election-audit.service";
import { notifyMembers } from "./notification.service";

export async function submitNomination(input: {
  electionId: string;
  memberId: string;
  statement: string;
  manifesto?: string | null;
  experience?: string | null;
  goals?: string | null;
  slogan?: string | null;
}) {
  const election = await prisma.election.findUnique({ where: { id: input.electionId } });
  if (!election || election.deletedAt) throw new AppError(API_ERROR_CODES.NOT_FOUND, "Election not found.", 404);
  if (currentPhase(election) !== "NOMINATION_OPEN") throw new AppError(API_ERROR_CODES.FORBIDDEN, "Nominations are not open.", 403);
  const voter = await prisma.electionVoter.findUnique({ where: { electionId_memberId: { electionId: input.electionId, memberId: input.memberId } } });
  if (!voter || voter.status !== "ELIGIBLE") throw new AppError(API_ERROR_CODES.FORBIDDEN, "You are not eligible for this election.", 403);
  const nomination = await prisma.electionNomination.create({ data: input, include: { member: true } });
  await recordElectionAudit({ electionId: input.electionId, actorMemberId: input.memberId, action: "NOMINATION_SUBMITTED", entityId: nomination.id });
  return { nomination };
}

export async function withdrawNomination(input: { electionId: string; memberId: string }) {
  const election = await prisma.election.findUnique({ where: { id: input.electionId } });
  if (!election || currentPhase(election) === "CANDIDATES_ANNOUNCED") throw new AppError(API_ERROR_CODES.FORBIDDEN, "This nomination can no longer be withdrawn.", 403);
  const nomination = await prisma.electionNomination.update({
    where: { electionId_memberId: { electionId: input.electionId, memberId: input.memberId } },
    data: { status: "WITHDRAWN" },
    include: { member: true }
  });
  return { nomination };
}

export async function listNominations(electionId: string) {
  const nominations = await prisma.electionNomination.findMany({ where: { electionId }, include: { member: true }, orderBy: { submittedAt: "desc" } });
  return { nominations };
}

export async function approveNomination(input: { electionId: string; nominationId: string; actorMemberId: string }) {
  const nomination = await prisma.electionNomination.update({
    where: { id: input.nominationId },
    data: { status: "APPROVED", reviewedById: input.actorMemberId, reviewedAt: new Date() }
  });
  const candidate = await prisma.electionCandidate.upsert({
    where: { electionId_memberId: { electionId: input.electionId, memberId: nomination.memberId } },
    update: {
      nominationId: nomination.id,
      statement: nomination.statement,
      manifesto: nomination.manifesto,
      goals: nomination.goals,
      slogan: nomination.slogan,
      status: "ANNOUNCED"
    },
    create: {
      electionId: input.electionId,
      nominationId: nomination.id,
      memberId: nomination.memberId,
      statement: nomination.statement,
      manifesto: nomination.manifesto,
      goals: nomination.goals,
      slogan: nomination.slogan
    }
  });
  await recordElectionAudit({ electionId: input.electionId, actorMemberId: input.actorMemberId, action: "NOMINATION_APPROVED", entityId: nomination.id });
  await notifyMembers({
    memberIds: [nomination.memberId],
    type: "ELECTION_NOMINATION_APPROVED",
    title: "Nomination approved",
    body: "Your election nomination has been approved.",
    entityType: "ELECTION",
    entityId: input.electionId,
    actionLabel: "View election",
    actionUrl: `/elections/${input.electionId}`,
    priority: "HIGH",
    push: true
  });
  return { nomination, candidate };
}

export async function rejectNomination(input: { electionId: string; nominationId: string; actorMemberId: string; reason: string }) {
  const nomination = await prisma.electionNomination.update({
    where: { id: input.nominationId },
    data: { status: "REJECTED", reviewedById: input.actorMemberId, reviewedAt: new Date(), rejectionReason: input.reason }
  });
  await recordElectionAudit({ electionId: input.electionId, actorMemberId: input.actorMemberId, action: "NOMINATION_REJECTED", entityId: nomination.id });
  await notifyMembers({
    memberIds: [nomination.memberId],
    type: "ELECTION_NOMINATION_REJECTED",
    title: "Nomination rejected",
    body: "Your election nomination was reviewed. Open the election for details.",
    entityType: "ELECTION",
    entityId: input.electionId,
    actionLabel: "View election",
    actionUrl: `/elections/${input.electionId}`,
    priority: "HIGH",
    push: true
  });
  return { nomination };
}
