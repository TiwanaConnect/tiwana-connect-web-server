import type { Election, ElectionAudit, ElectionBallot, ElectionCandidate, ElectionNomination, ElectionResult, ElectionVoter, Member } from "@prisma/client";

import { getMemberDisplayNameForViewer } from "@/lib/privacy/member-display";
import type { MobileElectionCandidateDto, MobileElectionDto, MobileElectionResultDto } from "@/types/election";

export type ElectionWithRelations = Election & {
  nominations: Array<ElectionNomination & { member: Member }>;
  candidates: Array<ElectionCandidate & { member: Member }>;
  voters: Array<ElectionVoter & { member: Member }>;
  result: ElectionResult | null;
  ballots?: ElectionBallot[];
  audits?: ElectionAudit[];
};

type ResultRow = {
  candidateId: string;
  memberId: string;
  voteCount: number;
  percentage: number;
};

export function currentPhase(election: Pick<Election, "status">) {
  return election.status;
}

function resultRows(result: ElectionResult | null): ResultRow[] {
  return Array.isArray(result?.resultsJson) ? result.resultsJson as ResultRow[] : [];
}

export function toMobileElectionCandidateDto(input: {
  candidate: ElectionCandidate & { member: Member };
  viewerRole: "MEMBER" | "PRESIDENT" | "SUPER_ADMIN";
  result?: ResultRow;
  winnerCandidateId?: string | null;
  includeResult?: boolean;
}): MobileElectionCandidateDto {
  return {
    id: input.candidate.id,
    memberId: input.candidate.memberId,
    displayName: getMemberDisplayNameForViewer(input.candidate.member, input.viewerRole),
    initials: input.candidate.member.initials,
    city: input.candidate.member.city,
    profession: input.candidate.member.profession,
    statement: input.candidate.statement,
    manifesto: input.candidate.manifesto,
    goals: input.candidate.goals,
    slogan: input.candidate.slogan,
    status: input.candidate.status,
    ...(input.includeResult ? { voteCount: input.result?.voteCount ?? 0, percentage: input.result?.percentage ?? 0, isWinner: input.winnerCandidateId === input.candidate.id } : {})
  };
}

export function toMobileElectionDto(election: ElectionWithRelations, viewerMemberId: string, viewerRole: "MEMBER" | "PRESIDENT" | "SUPER_ADMIN"): MobileElectionDto {
  const voter = election.voters.find((item) => item.memberId === viewerMemberId);
  const nomination = election.nominations.find((item) => item.memberId === viewerMemberId);
  const phase = currentPhase(election);
  const includeResult = election.resultStatus === "PUBLISHED";
  const rows = resultRows(election.result);
  const candidates = election.candidates
    .filter((candidate) => candidate.status === "ANNOUNCED")
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .map((candidate) => toMobileElectionCandidateDto({
      candidate,
      viewerRole,
      result: rows.find((row) => row.candidateId === candidate.id),
      winnerCandidateId: election.winnerCandidateId,
      includeResult
    }));
  const totalEligible = election.result?.totalEligibleVoters ?? election.voters.filter((item) => item.status === "ELIGIBLE" || item.status === "VOTED").length;
  const totalVotes = election.result?.totalVotesCast ?? election.voters.filter((item) => item.hasVoted).length;
  const result: MobileElectionResultDto | null = includeResult && election.result
    ? {
        totalEligibleVoters: election.result.totalEligibleVoters,
        totalVotesCast: election.result.totalVotesCast,
        invalidBallots: election.result.invalidBallots,
        turnoutPercentage: totalEligible > 0 ? Math.round((totalVotes / totalEligible) * 10000) / 100 : 0,
        resultHash: election.result.resultHash,
        candidates,
        publishedAt: election.result.publishedAt?.toISOString() ?? null
      }
    : null;

  return {
    id: election.id,
    title: election.title,
    description: election.description,
    positionTitle: election.positionTitle,
    status: election.status,
    currentPhase: phase,
    timeline: [
      {
        type: "NOMINATION_OPEN",
        title: "Nominations Open",
        at: election.nominationStartAt.toISOString()
      },
      {
        type: "NOMINATION_CLOSED",
        title: "Nominations Close",
        at: election.nominationEndAt.toISOString()
      },
      {
        type: "VOTING_OPEN",
        title: "Voting Opens",
        at: election.votingStartAt.toISOString()
      },
      {
        type: "VOTING_CLOSED",
        title: "Voting Closes",
        at: election.votingEndAt.toISOString()
      }
    ],
    nominationStatus: nomination?.status ?? null,
    voteStatus: phase !== "VOTING_OPEN" ? (phase === "VOTING_CLOSED" || includeResult ? "closed" : "not_open") : voter?.hasVoted ? "already_voted" : voter?.status === "ELIGIBLE" ? "eligible" : "not_eligible",
    hasVoted: voter?.hasVoted ?? false,
    voteReceiptHash: voter?.receiptHash ?? null,
    voteReceiptCode: voter?.receiptCode ?? null,
    candidates,
    result,
    ceremony: election.ceremonyAt || election.winnerMemberId
      ? {
          ceremonyAt: election.ceremonyAt?.toISOString() ?? null,
          winnerDisplayName: election.winnerMemberId ? candidates.find((candidate) => candidate.memberId === election.winnerMemberId)?.displayName ?? null : null,
          isCompleted: election.status === "COMPLETED"
        }
      : null
  };
}

export function toAdminElectionDto(election: ElectionWithRelations, chainValid?: boolean) {
  const totalEligible = election.voters.filter((item) => item.status === "ELIGIBLE" || item.status === "VOTED").length;
  const totalVotes = election.voters.filter((item) => item.hasVoted).length;
  return {
    id: election.id,
    title: election.title,
    description: election.description,
    positionTitle: election.positionTitle,
    status: election.status,
    currentPhase: currentPhase(election),
    resultStatus: election.resultStatus,
    nominationStartAt: election.nominationStartAt.toISOString(),
    nominationEndAt: election.nominationEndAt.toISOString(),
    votingStartAt: election.votingStartAt.toISOString(),
    votingEndAt: election.votingEndAt.toISOString(),
    ceremonyAt: election.ceremonyAt?.toISOString() ?? null,
    isPublished: election.isPublished,
    isLocked: election.isLocked,
    totalEligibleVoters: totalEligible,
    totalVotesCast: totalVotes,
    turnoutPercentage: totalEligible > 0 ? Math.round((totalVotes / totalEligible) * 10000) / 100 : 0,
    nominationsCount: election.nominations.length,
    candidatesCount: election.candidates.length,
    winnerCandidateId: election.winnerCandidateId,
    winnerMemberId: election.winnerMemberId,
    ballotChainValid: chainValid,
    result: election.result,
    nominations: election.nominations.map((item) => ({ ...item, memberName: item.member.fullName ?? item.member.alias ?? "Unnamed Member" })),
    candidates: election.candidates.map((item) => ({ ...item, memberName: item.member.fullName ?? item.member.alias ?? "Unnamed Member" })),
    audits: election.audits ?? []
  };
}
