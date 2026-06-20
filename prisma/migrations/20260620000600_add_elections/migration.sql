ALTER TYPE "AuditEntityType" ADD VALUE 'ELECTION';

CREATE TYPE "ElectionStatus" AS ENUM ('DRAFT', 'ANNOUNCED', 'NOMINATION_OPEN', 'NOMINATION_CLOSED', 'NOMINATION_REVIEW', 'CANDIDATES_ANNOUNCED', 'VOTING_SCHEDULED', 'VOTING_OPEN', 'VOTING_CLOSED', 'TALLYING', 'RESULT_ANNOUNCED', 'PRESIDENT_AUTH_CEREMONY', 'COMPLETED', 'CANCELLED');
CREATE TYPE "ElectionPhaseType" AS ENUM ('NOMINATION_OPEN', 'NOMINATION_CLOSED', 'NOMINATION_APPROVAL_COMPLETION', 'CANDIDATES_ANNOUNCED', 'VOTING_OPEN', 'VOTING_CLOSED', 'RESULT_ANNOUNCED', 'PRESIDENT_AUTH_CEREMONY', 'COMPLETED');
CREATE TYPE "NominationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'WITHDRAWN');
CREATE TYPE "CandidateStatus" AS ENUM ('ANNOUNCED', 'DISQUALIFIED', 'WITHDRAWN');
CREATE TYPE "VoterStatus" AS ENUM ('ELIGIBLE', 'VOTED', 'BLOCKED', 'NOT_ELIGIBLE');
CREATE TYPE "ElectionResultStatus" AS ENUM ('NOT_READY', 'TALLYING', 'FINALIZED', 'PUBLISHED');
CREATE TYPE "ElectionAuditAction" AS ENUM ('ELECTION_CREATED', 'ELECTION_UPDATED', 'PHASE_EXTENDED', 'NOMINATION_SUBMITTED', 'NOMINATION_APPROVED', 'NOMINATION_REJECTED', 'CANDIDATES_ANNOUNCED', 'VOTE_CAST', 'VOTING_CLOSED', 'TALLY_STARTED', 'RESULT_FINALIZED', 'RESULT_PUBLISHED', 'CEREMONY_SCHEDULED', 'PRESIDENT_ASSIGNED', 'ELECTION_CANCELLED');

CREATE TABLE "Election" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "positionTitle" TEXT NOT NULL DEFAULT 'President',
  "status" "ElectionStatus" NOT NULL DEFAULT 'DRAFT',
  "resultStatus" "ElectionResultStatus" NOT NULL DEFAULT 'NOT_READY',
  "nominationStartAt" TIMESTAMP(3) NOT NULL,
  "nominationEndAt" TIMESTAMP(3) NOT NULL,
  "approvalDeadlineAt" TIMESTAMP(3),
  "candidatesAnnouncedAt" TIMESTAMP(3),
  "votingStartAt" TIMESTAMP(3) NOT NULL,
  "votingEndAt" TIMESTAMP(3) NOT NULL,
  "resultAnnouncedAt" TIMESTAMP(3),
  "ceremonyAt" TIMESTAMP(3),
  "eligibilityRules" JSONB,
  "maxVotesPerMember" INTEGER NOT NULL DEFAULT 1,
  "isPublished" BOOLEAN NOT NULL DEFAULT false,
  "isLocked" BOOLEAN NOT NULL DEFAULT false,
  "lockedAt" TIMESTAMP(3),
  "winnerCandidateId" TEXT,
  "winnerMemberId" TEXT,
  "createdById" TEXT NOT NULL,
  "updatedById" TEXT,
  "cancelledAt" TIMESTAMP(3),
  "cancelledById" TEXT,
  "cancelReason" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "Election_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ElectionPhase" (
  "id" TEXT NOT NULL,
  "electionId" TEXT NOT NULL,
  "type" "ElectionPhaseType" NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "startsAt" TIMESTAMP(3),
  "endsAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "isActive" BOOLEAN NOT NULL DEFAULT false,
  "isCompleted" BOOLEAN NOT NULL DEFAULT false,
  "extensionCount" INTEGER NOT NULL DEFAULT 0,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ElectionPhase_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ElectionNomination" (
  "id" TEXT NOT NULL,
  "electionId" TEXT NOT NULL,
  "memberId" TEXT NOT NULL,
  "status" "NominationStatus" NOT NULL DEFAULT 'PENDING',
  "statement" TEXT NOT NULL,
  "manifesto" TEXT,
  "experience" TEXT,
  "goals" TEXT,
  "slogan" TEXT,
  "reviewedById" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "rejectionReason" TEXT,
  "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ElectionNomination_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ElectionCandidate" (
  "id" TEXT NOT NULL,
  "electionId" TEXT NOT NULL,
  "nominationId" TEXT,
  "memberId" TEXT NOT NULL,
  "status" "CandidateStatus" NOT NULL DEFAULT 'ANNOUNCED',
  "displayOrder" INTEGER NOT NULL DEFAULT 0,
  "statement" TEXT NOT NULL,
  "manifesto" TEXT,
  "goals" TEXT,
  "slogan" TEXT,
  "announcedAt" TIMESTAMP(3),
  "disqualifiedAt" TIMESTAMP(3),
  "disqualifiedById" TEXT,
  "disqualificationReason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ElectionCandidate_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ElectionVoter" (
  "id" TEXT NOT NULL,
  "electionId" TEXT NOT NULL,
  "memberId" TEXT NOT NULL,
  "status" "VoterStatus" NOT NULL DEFAULT 'ELIGIBLE',
  "hasVoted" BOOLEAN NOT NULL DEFAULT false,
  "votedAt" TIMESTAMP(3),
  "receiptHash" TEXT,
  "receiptCode" TEXT,
  "eligibilityReason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ElectionVoter_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ElectionBallot" (
  "id" TEXT NOT NULL,
  "electionId" TEXT NOT NULL,
  "encryptedPayload" TEXT NOT NULL,
  "iv" TEXT NOT NULL,
  "authTag" TEXT NOT NULL,
  "ballotHash" TEXT NOT NULL,
  "previousBallotHash" TEXT,
  "hashChainIndex" INTEGER NOT NULL,
  "castAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ElectionBallot_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ElectionResult" (
  "id" TEXT NOT NULL,
  "electionId" TEXT NOT NULL,
  "status" "ElectionResultStatus" NOT NULL DEFAULT 'NOT_READY',
  "totalEligibleVoters" INTEGER NOT NULL DEFAULT 0,
  "totalVotesCast" INTEGER NOT NULL DEFAULT 0,
  "invalidBallots" INTEGER NOT NULL DEFAULT 0,
  "winnerCandidateId" TEXT,
  "winnerMemberId" TEXT,
  "resultsJson" JSONB,
  "resultHash" TEXT,
  "finalizedAt" TIMESTAMP(3),
  "finalizedBySystem" BOOLEAN NOT NULL DEFAULT false,
  "publishedAt" TIMESTAMP(3),
  "publishedById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ElectionResult_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ElectionAudit" (
  "id" TEXT NOT NULL,
  "electionId" TEXT NOT NULL,
  "actorMemberId" TEXT,
  "action" "ElectionAuditAction" NOT NULL,
  "entityId" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ElectionAudit_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Election_status_idx" ON "Election"("status");
CREATE INDEX "Election_resultStatus_idx" ON "Election"("resultStatus");
CREATE INDEX "Election_votingStartAt_idx" ON "Election"("votingStartAt");
CREATE INDEX "Election_votingEndAt_idx" ON "Election"("votingEndAt");
CREATE INDEX "Election_isPublished_idx" ON "Election"("isPublished");
CREATE INDEX "Election_isLocked_idx" ON "Election"("isLocked");
CREATE INDEX "Election_deletedAt_idx" ON "Election"("deletedAt");
CREATE UNIQUE INDEX "ElectionPhase_electionId_type_key" ON "ElectionPhase"("electionId", "type");
CREATE INDEX "ElectionPhase_electionId_idx" ON "ElectionPhase"("electionId");
CREATE INDEX "ElectionPhase_type_idx" ON "ElectionPhase"("type");
CREATE UNIQUE INDEX "ElectionNomination_electionId_memberId_key" ON "ElectionNomination"("electionId", "memberId");
CREATE INDEX "ElectionNomination_electionId_idx" ON "ElectionNomination"("electionId");
CREATE INDEX "ElectionNomination_memberId_idx" ON "ElectionNomination"("memberId");
CREATE INDEX "ElectionNomination_status_idx" ON "ElectionNomination"("status");
CREATE UNIQUE INDEX "ElectionCandidate_nominationId_key" ON "ElectionCandidate"("nominationId");
CREATE UNIQUE INDEX "ElectionCandidate_electionId_memberId_key" ON "ElectionCandidate"("electionId", "memberId");
CREATE INDEX "ElectionCandidate_electionId_idx" ON "ElectionCandidate"("electionId");
CREATE INDEX "ElectionCandidate_memberId_idx" ON "ElectionCandidate"("memberId");
CREATE INDEX "ElectionCandidate_status_idx" ON "ElectionCandidate"("status");
CREATE UNIQUE INDEX "ElectionVoter_electionId_memberId_key" ON "ElectionVoter"("electionId", "memberId");
CREATE INDEX "ElectionVoter_electionId_idx" ON "ElectionVoter"("electionId");
CREATE INDEX "ElectionVoter_memberId_idx" ON "ElectionVoter"("memberId");
CREATE INDEX "ElectionVoter_status_idx" ON "ElectionVoter"("status");
CREATE INDEX "ElectionVoter_hasVoted_idx" ON "ElectionVoter"("hasVoted");
CREATE UNIQUE INDEX "ElectionBallot_ballotHash_key" ON "ElectionBallot"("ballotHash");
CREATE INDEX "ElectionBallot_electionId_idx" ON "ElectionBallot"("electionId");
CREATE INDEX "ElectionBallot_hashChainIndex_idx" ON "ElectionBallot"("hashChainIndex");
CREATE INDEX "ElectionBallot_castAt_idx" ON "ElectionBallot"("castAt");
CREATE UNIQUE INDEX "ElectionResult_electionId_key" ON "ElectionResult"("electionId");
CREATE INDEX "ElectionAudit_electionId_idx" ON "ElectionAudit"("electionId");
CREATE INDEX "ElectionAudit_actorMemberId_idx" ON "ElectionAudit"("actorMemberId");
CREATE INDEX "ElectionAudit_action_idx" ON "ElectionAudit"("action");
CREATE INDEX "ElectionAudit_createdAt_idx" ON "ElectionAudit"("createdAt");

ALTER TABLE "Election" ADD CONSTRAINT "Election_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ElectionPhase" ADD CONSTRAINT "ElectionPhase_electionId_fkey" FOREIGN KEY ("electionId") REFERENCES "Election"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ElectionNomination" ADD CONSTRAINT "ElectionNomination_electionId_fkey" FOREIGN KEY ("electionId") REFERENCES "Election"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ElectionNomination" ADD CONSTRAINT "ElectionNomination_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ElectionCandidate" ADD CONSTRAINT "ElectionCandidate_electionId_fkey" FOREIGN KEY ("electionId") REFERENCES "Election"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ElectionCandidate" ADD CONSTRAINT "ElectionCandidate_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ElectionCandidate" ADD CONSTRAINT "ElectionCandidate_nominationId_fkey" FOREIGN KEY ("nominationId") REFERENCES "ElectionNomination"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ElectionVoter" ADD CONSTRAINT "ElectionVoter_electionId_fkey" FOREIGN KEY ("electionId") REFERENCES "Election"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ElectionVoter" ADD CONSTRAINT "ElectionVoter_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ElectionBallot" ADD CONSTRAINT "ElectionBallot_electionId_fkey" FOREIGN KEY ("electionId") REFERENCES "Election"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ElectionResult" ADD CONSTRAINT "ElectionResult_electionId_fkey" FOREIGN KEY ("electionId") REFERENCES "Election"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ElectionAudit" ADD CONSTRAINT "ElectionAudit_electionId_fkey" FOREIGN KEY ("electionId") REFERENCES "Election"("id") ON DELETE CASCADE ON UPDATE CASCADE;
