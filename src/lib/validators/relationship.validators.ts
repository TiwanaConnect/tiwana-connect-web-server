import { FamilyRelationshipType } from "@prisma/client";
import { z } from "zod";

export const createRelationshipSchema = z.object({
  toMemberId: z.string().min(1),
  type: z.nativeEnum(FamilyRelationshipType),
  metadata: z.record(z.unknown()).optional()
});

export const bulkRelationshipRowSchema = z.object({
  fromMemberIdentifier: z.string().trim().min(1),
  toMemberIdentifier: z.string().trim().min(1),
  type: z.nativeEnum(FamilyRelationshipType)
});
