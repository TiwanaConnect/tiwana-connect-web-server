export type MobileElectionPhaseDto = {
  type: string;
  title: string;
  description: string | null;
  startsAt: string | null;
  endsAt: string | null;
  isActive: boolean;
  isCompleted: boolean;
  extensionCount: number;
};

export type MobileElectionCandidateDto = {
  id: string;
  memberId: string;
  displayName: string;
  initials: string;
  city: string | null;
  profession: string | null;
  statement: string;
  manifesto: string | null;
  goals: string | null;
  slogan: string | null;
  status: string;
  voteCount?: number;
  percentage?: number;
  isWinner?: boolean;
};

export type MobileElectionResultDto = {
  totalEligibleVoters: number;
  totalVotesCast: number;
  invalidBallots: number;
  turnoutPercentage: number;
  resultHash: string | null;
  candidates: MobileElectionCandidateDto[];
  publishedAt: string | null;
};

export type MobileElectionDto = {
  id: string;
  title: string;
  description: string | null;
  positionTitle: string;
  status: string;
  currentPhase: string;
  timeline: MobileElectionPhaseDto[];
  nominationStatus: string | null;
  voteStatus: "not_open" | "eligible" | "already_voted" | "closed" | "not_eligible";
  hasVoted: boolean;
  voteReceiptHash?: string | null;
  voteReceiptCode?: string | null;
  candidates: MobileElectionCandidateDto[];
  result: MobileElectionResultDto | null;
  ceremony: {
    ceremonyAt: string | null;
    winnerDisplayName: string | null;
    isCompleted: boolean;
  } | null;
};
