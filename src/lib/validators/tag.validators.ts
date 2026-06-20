import { MemberTagType } from "@prisma/client";
import { z } from "zod";

const emptyToUndefined = (value: unknown) => (value === "" ? undefined : value);
const slugSchema = z.string().trim().min(1).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

export const tagListQuerySchema = z.object({
  q: z.string().optional(),
  type: z.nativeEnum(MemberTagType).optional(),
  isActive: z.enum(["true", "false"]).optional()
});

export const createTagSchema = z.object({
  name: z.string().trim().min(1),
  slug: z.preprocess(emptyToUndefined, slugSchema.optional()),
  type: z.nativeEnum(MemberTagType).default(MemberTagType.OTHER),
  description: z.preprocess(emptyToUndefined, z.string().trim().min(1).nullable().optional()),
  color: z.preprocess(emptyToUndefined, z.string().trim().min(1).nullable().optional()),
  isActive: z.boolean().optional().default(true)
});

export const updateTagSchema = createTagSchema.partial();

export const assignTagsSchema = z.object({
  tagIds: z.array(z.string().min(1)).min(1)
});
