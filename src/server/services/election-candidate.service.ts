import { prisma } from "@/lib/db/prisma";
import { recordElectionAudit } from "./election-audit.service";
import { notifyMembers } from "./notification.service";

export async function announceCandidates(input: { electionId: string; actorMemberId: string }) {
  const now = new Date();
  await prisma.electionCandidate.updateMany({ where: { electionId: input.electionId, status: "ANNOUNCED" }, data: { announcedAt: now } });
  const election = await prisma.election.update({ where: { id: input.electionId }, data: { candidatesAnnouncedAt: now, isPublished: true } });
  await recordElectionAudit({ electionId: input.electionId, actorMemberId: input.actorMemberId, action: "CANDIDATES_ANNOUNCED" });
  const voters = await prisma.electionVoter.findMany({
    where: { electionId: input.electionId, status: { in: ["ELIGIBLE", "VOTED"] } },
    select: { memberId: true }
  });
  await notifyMembers({
    memberIds: voters.map((voter) => voter.memberId),
    type: "ELECTION_CANDIDATE_ANNOUNCED",
    title: `Candidates announced: ${election.title}`,
    body: "Election candidates are now available.",
    entityType: "ELECTION",
    entityId: election.id,
    actionLabel: "View election",
    actionUrl: `/elections/${election.id}`,
    priority: "HIGH",
    push: true
  });
  return { election };
}
