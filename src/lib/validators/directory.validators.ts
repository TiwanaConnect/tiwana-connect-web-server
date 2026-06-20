import { DirectoryVisibility, MemberGender, VisibilityStatus } from "@prisma/client";
import { z } from "zod";

const emptyToUndefined = (value: unknown) => (value === "" ? undefined : value);
const csv = z.preprocess((value) => {
  if (typeof value !== "string" || value.trim() === "") return undefined;
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}, z.array(z.string().min(1)).optional());
const nullableString = z.preprocess(
  emptyToUndefined,
  z.string().trim().min(1).nullable().optional()
);

export const directoryListQuerySchema = z.object({
  q: z.string().optional(),
  city: z.string().optional(),
  profession: z.string().optional(),
  gender: z.nativeEnum(MemberGender).optional(),
  branchLabel: z.string().optional(),
  tagIds: csv,
  tagSlugs: csv,
  limit: z.coerce.number().int().min(1).max(100).default(20),
  cursor: z.preprocess(emptyToUndefined, z.string().optional())
});

export const adminDirectoryListQuerySchema = directoryListQuerySchema.extend({
  visibility: z.nativeEnum(VisibilityStatus).optional(),
  directoryVisibility: z.nativeEnum(DirectoryVisibility).optional(),
  hasPhone: z.enum(["true", "false"]).optional()
});

export const updateDirectorySettingsSchema = z.object({
  visibility: z.nativeEnum(DirectoryVisibility).optional(),
  showPhone: z.boolean().optional(),
  showCity: z.boolean().optional(),
  showProfession: z.boolean().optional(),
  allowHelpRequests: z.boolean().optional(),
  bio: nullableString,
  availabilityNote: nullableString
});
