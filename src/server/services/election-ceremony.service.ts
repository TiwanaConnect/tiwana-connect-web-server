import { API_ERROR_CODES, AppError } from "@/lib/api/errors";
import { prisma } from "@/lib/db/prisma";

import { recordElectionAudit } from "./election-audit.service";
import { notifyMembers } from "./notification.service";

export async function scheduleCeremony(input: { electionId: string; actorMemberId: string; ceremonyAt: string }) {
  const election = await prisma.election.update({ where: { id: input.electionId }, data: { ceremonyAt: new Date(input.ceremonyAt), status: "PRESIDENT_AUTH_CEREMONY" } });
  await recordElectionAudit({ electionId: input.electionId, actorMemberId: input.actorMemberId, action: "CEREMONY_SCHEDULED" });
  const voters = await prisma.electionVoter.findMany({
    where: { electionId: input.electionId, status: { in: ["ELIGIBLE", "VOTED"] } },
    select: { memberId: true }
  });
  await notifyMembers({
    memberIds: voters.map((voter) => voter.memberId),
    type: "PRESIDENT_CEREMONY",
    title: `President ceremony scheduled: ${election.title}`,
    body: "The president authorization ceremony has been scheduled.",
    entityType: "ELECTION",
    entityId: election.id,
    actionLabel: "View election",
    actionUrl: `/elections/${election.id}`,
    priority: "HIGH",
    metadata: { ceremonyAt: election.ceremonyAt?.toISOString() },
    push: true
  });
  return { election };
}

export async function assignPresident(input: { electionId: string; actorMemberId: string }) {
  const election = await prisma.election.findUnique({ where: { id: input.electionId } });
  if (!election?.winnerMemberId || election.resultStatus !== "PUBLISHED") throw new AppError(API_ERROR_CODES.FORBIDDEN, "Published result with winner is required.", 403);
  await prisma.$transaction(async (tx) => {
    await tx.userAccount.updateMany({ where: { role: "PRESIDENT" }, data: { role: "MEMBER" } });
    await tx.userAccount.updateMany({ where: { memberId: election.winnerMemberId ?? undefined }, data: { role: "PRESIDENT" } });
    await tx.election.update({ where: { id: input.electionId }, data: { status: "PRESIDENT_AUTH_CEREMONY" } });
  });
  await recordElectionAudit({ electionId: input.electionId, actorMemberId: input.actorMemberId, action: "PRESIDENT_ASSIGNED", entityId: election.winnerMemberId });
  return { ok: true };
}

export async function completeElection(input: { electionId: string; actorMemberId: string }) {
  const election = await prisma.election.update({ where: { id: input.electionId }, data: { status: "COMPLETED" } });
  return { election };
}
