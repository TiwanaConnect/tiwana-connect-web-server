import { z } from "zod";

export const treeViewModeSchema = z.enum(["close", "branch", "full", "relationship"]);

const optionalId = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.string().min(1).optional()
);

export const familyTreeQuerySchema = z.object({
  focusMemberId: optionalId,
  generations: z.coerce.number().int().min(1).max(6).default(3),
  viewMode: treeViewModeSchema.default("close"),
  includeHiddenNames: z
    .enum(["true", "false"])
    .optional()
    .transform((value) => value !== "false")
});

export const relationshipQuerySchema = z.object({
  startMemberId: optionalId,
  targetMemberId: z.string().min(1)
});

export const adminRelationshipQuerySchema = z.object({
  startMemberId: z.string().min(1),
  targetMemberId: z.string().min(1)
});

export const memberSearchQuerySchema = z.object({
  q: z.string().optional().default(""),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  cursor: optionalId
});
