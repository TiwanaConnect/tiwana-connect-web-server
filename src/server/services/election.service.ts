import type { Prisma } from "@prisma/client";

import { API_ERROR_CODES, AppError } from "@/lib/api/errors";
import { prisma } from "@/lib/db/prisma";
import { toAdminElectionDto, toMobileElectionDto } from "@/server/dto/election.dto";
import { electionInclude, findElectionById, findElections } from "@/server/repositories/election.repository";

import { recordElectionAudit } from "./election-audit.service";
import { notifyMembers } from "./notification.service";

type ElectionPayload = {
  title: string;
  description?: string | null;
  positionTitle?: string;
  nominationStartAt: string;
  nominationEndAt: string;
  approvalDeadlineAt?: string | null;
  candidatesAnnouncedAt?: string | null;
  votingStartAt: string;
  votingEndAt: string;
  resultAnnouncedAt?: string | null;
  ceremonyAt?: string | null;
  eligibilityRules?: Record<string, unknown>;
};

function dt(value?: string | null) {
  return value ? new Date(value) : null;
}

const phaseSpecs = [
  ["NOMINATION_OPEN", "Nomination Open"],
  ["NOMINATION_CLOSED", "Nomination Closed"],
  ["VOTING_OPEN", "Voting Open"],
  ["VOTING_CLOSED", "Voting Closed"],
  ["RESULT_ANNOUNCED", "Result Announced"],
] as const;

function phaseDates(input: ElectionPayload, type: (typeof phaseSpecs)[number][0]) {
  if (type === "NOMINATION_OPEN") return { startsAt: dt(input.nominationStartAt), endsAt: dt(input.nominationEndAt) };
  if (type === "NOMINATION_CLOSED") return { startsAt: dt(input.nominationEndAt), endsAt: dt(input.votingStartAt) };
  if (type === "VOTING_OPEN") return { startsAt: dt(input.votingStartAt), endsAt: dt(input.votingEndAt) };
  if (type === "VOTING_CLOSED") return { startsAt: dt(input.votingEndAt), endsAt: dt(input.resultAnnouncedAt) };
  if (type === "RESULT_ANNOUNCED") return { startsAt: dt(input.resultAnnouncedAt), endsAt: dt(input.ceremonyAt) };
  return { startsAt: null, endsAt: null };
}

async function eligibleMembers(rules?: Record<string, unknown>) {
  const requireLoginAccount = rules?.requireLoginAccount !== false;
  return prisma.member.findMany({
    where: {
      deletedAt: null,
      ...(rules?.allowBlockedMembers ? {} : { status: "ACTIVE" }),
      ...(requireLoginAccount ? { userAccount: { isActive: true } } : {})
    },
    select: { id: true }
  });
}

export async function listAdminElections(filters: { limit: number; cursor?: string }) {
  const elections = await findElections({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
    ...(filters.cursor ? { cursor: { id: filters.cursor }, skip: 1 } : {}),
    take: filters.limit + 1
  });
  return { elections: elections.slice(0, filters.limit).map((election) => toAdminElectionDto(election)), nextCursor: elections.length > filters.limit ? elections[filters.limit]?.id ?? null : null };
}

export async function listMobileElections(input: { memberId: string; role: "MEMBER" | "PRESIDENT" | "SUPER_ADMIN"; limit: number; cursor?: string }) {
  const elections = await findElections({
    where: { deletedAt: null, isPublished: true, status: { not: "CANCELLED" } },
    orderBy: { createdAt: "desc" },
    ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
    take: input.limit + 1
  });
  return { elections: elections.slice(0, input.limit).map((election) => toMobileElectionDto(election, input.memberId, input.role)), nextCursor: elections.length > input.limit ? elections[input.limit]?.id ?? null : null };
}

export async function getElectionDetail(input: { electionId: string; viewerMemberId: string; viewerRole: "MEMBER" | "PRESIDENT" | "SUPER_ADMIN"; admin?: boolean }) {
  const election = await findElectionById(input.electionId);
  if (!election || election.deletedAt) throw new AppError(API_ERROR_CODES.NOT_FOUND, "Election not found.", 404);
  return { election: input.admin ? toAdminElectionDto(election) : toMobileElectionDto(election, input.viewerMemberId, input.viewerRole) };
}

export async function getActiveElection(input: { memberId: string; role: "MEMBER" | "PRESIDENT" | "SUPER_ADMIN" }) {
  const election = await prisma.election.findFirst({
    where: { deletedAt: null, isPublished: true, status: { notIn: ["COMPLETED", "CANCELLED"] } },
    include: electionInclude,
    orderBy: { createdAt: "desc" }
  });
  return { election: election ? toMobileElectionDto(election, input.memberId, input.role) : null };
}

export async function createElection(input: ElectionPayload & { actorMemberId: string }) {
  const members = await eligibleMembers(input.eligibilityRules);
  const electionId = await prisma.$transaction(async (tx) => {
    const created = await tx.election.create({
      data: {
        title: input.title,
        description: input.description,
        positionTitle: input.positionTitle ?? "President",
        nominationStartAt: new Date(input.nominationStartAt),
        nominationEndAt: new Date(input.nominationEndAt),
        approvalDeadlineAt: dt(input.approvalDeadlineAt),
        candidatesAnnouncedAt: dt(input.candidatesAnnouncedAt),
        votingStartAt: new Date(input.votingStartAt),
        votingEndAt: new Date(input.votingEndAt),
        resultAnnouncedAt: dt(input.resultAnnouncedAt),
        ceremonyAt: dt(input.ceremonyAt),
        eligibilityRules: input.eligibilityRules as Prisma.InputJsonValue,
        createdById: input.actorMemberId,
        phases: { create: phaseSpecs.map(([type, title]) => ({ type, title, ...phaseDates(input, type) })) },
        result: { create: {} }
      }
    });
    if (members.length > 0) {
      await tx.electionVoter.createMany({
        data: members.map((member) => ({ electionId: created.id, memberId: member.id })),
        skipDuplicates: true
      });
    }
    await tx.electionAudit.create({ data: { electionId: created.id, actorMemberId: input.actorMemberId, action: "ELECTION_CREATED" } });
    return created.id;
  }, { timeout: 20000 });
  const election = await findElectionById(electionId);
  if (!election) throw new AppError(API_ERROR_CODES.NOT_FOUND, "Election not found after creation.", 404);
  const now = new Date();
  if (election.nominationStartAt <= now && election.nominationEndAt > now) {
    await notifyMembers({
      memberIds: members.map((member) => member.id),
      type: "ELECTION_NOMINATION",
      title: `Nominations are open: ${election.title}`,
      body: "Eligible members can now submit a nomination.",
      entityType: "ELECTION",
      entityId: election.id,
      actionLabel: "View election",
      actionUrl: `/elections/${election.id}`,
      priority: "HIGH",
      push: true
    });
  }
  return toAdminElectionDto(election);
}

export async function updateElection(electionId: string, input: Partial<ElectionPayload> & { actorMemberId: string }) {
  const election = await prisma.election.update({
    where: { id: electionId },
    data: {
      title: input.title,
      description: input.description,
      positionTitle: input.positionTitle,
      nominationStartAt: input.nominationStartAt ? new Date(input.nominationStartAt) : undefined,
      nominationEndAt: input.nominationEndAt ? new Date(input.nominationEndAt) : undefined,
      approvalDeadlineAt: input.approvalDeadlineAt === undefined ? undefined : dt(input.approvalDeadlineAt),
      candidatesAnnouncedAt: input.candidatesAnnouncedAt === undefined ? undefined : dt(input.candidatesAnnouncedAt),
      votingStartAt: input.votingStartAt ? new Date(input.votingStartAt) : undefined,
      votingEndAt: input.votingEndAt ? new Date(input.votingEndAt) : undefined,
      resultAnnouncedAt: input.resultAnnouncedAt === undefined ? undefined : dt(input.resultAnnouncedAt),
      ceremonyAt: input.ceremonyAt === undefined ? undefined : dt(input.ceremonyAt),
      eligibilityRules: input.eligibilityRules as Prisma.InputJsonValue,
      updatedById: input.actorMemberId
    },
    include: electionInclude
  });
  await recordElectionAudit({ electionId, actorMemberId: input.actorMemberId, action: "ELECTION_UPDATED" });
  return toAdminElectionDto(election);
}

export async function announceElection(input: { electionId: string; actorMemberId: string }) {
  const election = await prisma.election.update({
    where: { id: input.electionId },
    data: {
      status: "ANNOUNCED",
      isPublished: true,
      updatedById: input.actorMemberId
    },
    include: electionInclude
  });
  await recordElectionAudit({ electionId: input.electionId, actorMemberId: input.actorMemberId, action: "ELECTION_UPDATED" });
  return toAdminElectionDto(election);
}

export async function cancelElection(input: { electionId: string; actorMemberId: string; reason?: string | null }) {
  const election = await prisma.election.update({
    where: { id: input.electionId },
    data: { status: "CANCELLED", cancelledAt: new Date(), cancelledById: input.actorMemberId, cancelReason: input.reason },
    include: electionInclude
  });
  await recordElectionAudit({ electionId: input.electionId, actorMemberId: input.actorMemberId, action: "ELECTION_CANCELLED" });
  return toAdminElectionDto(election);
}
