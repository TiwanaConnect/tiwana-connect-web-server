import { z } from "zod";

const emptyToUndefined = (value: unknown) => (value === "" ? undefined : value);
const nullableString = z.preprocess(emptyToUndefined, z.string().trim().min(1).nullable().optional());
const optionalDate = z.preprocess(emptyToUndefined, z.string().optional());

const electionBase = z.object({
  title: z.string().trim().min(1),
  description: nullableString,
  positionTitle: z.string().trim().min(1).default("President"),
  nominationStartAt: z.string().min(1),
  nominationEndAt: z.string().min(1),
  approvalDeadlineAt: optionalDate,
  candidatesAnnouncedAt: optionalDate,
  votingStartAt: z.string().min(1),
  votingEndAt: z.string().min(1),
  resultAnnouncedAt: optionalDate,
  ceremonyAt: optionalDate,
  eligibilityRules: z.object({
    onlyActiveMembers: z.boolean().optional(),
    requireLoginAccount: z.boolean().optional(),
    minAge: z.number().int().min(0).nullable().optional(),
    allowBlockedMembers: z.boolean().optional()
  }).optional()
});

function withTimelineRules<T extends z.ZodTypeAny>(schema: T) {
  return schema.refine((value) => {
    const item = value as { nominationStartAt?: string; nominationEndAt?: string; votingStartAt?: string; votingEndAt?: string; resultAnnouncedAt?: string; ceremonyAt?: string };
    return (!item.nominationStartAt || !item.nominationEndAt || new Date(item.nominationEndAt) > new Date(item.nominationStartAt)) &&
      (!item.votingStartAt || !item.votingEndAt || new Date(item.votingEndAt) > new Date(item.votingStartAt)) &&
      (!item.nominationEndAt || !item.votingStartAt || new Date(item.votingStartAt) >= new Date(item.nominationEndAt)) &&
      (!item.resultAnnouncedAt || !item.ceremonyAt || new Date(item.ceremonyAt) >= new Date(item.resultAnnouncedAt));
  }, { message: "Election timeline dates are not in a valid order." });
}

export const createElectionSchema = withTimelineRules(electionBase);
export const updateElectionSchema = withTimelineRules(electionBase.partial());

export const electionListQuerySchema = z.object({
  status: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  cursor: z.preprocess(emptyToUndefined, z.string().optional())
});

export const nominationSchema = z.object({
  statement: z.string().trim().min(1),
  manifesto: nullableString,
  experience: nullableString,
  goals: nullableString,
  slogan: nullableString
});

export const rejectNominationSchema = z.object({ reason: z.string().trim().min(1) });
export const castVoteSchema = z.object({ candidateId: z.string().min(1) });
export const scheduleCeremonySchema = z.object({ ceremonyAt: z.string().min(1) });
