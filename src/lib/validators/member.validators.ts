import { MemberGender, MemberStatus, UserRole, VisibilityStatus } from "@prisma/client";
import { z } from "zod";

const emptyToUndefined = (value: unknown) => (value === "" ? undefined : value);

const optionalMemberIdSchema = z.preprocess(
  emptyToUndefined,
  z.string().trim().min(1).nullable().optional()
);

const createRelationshipsSchema = z
  .object({
    fatherMemberId: optionalMemberIdSchema,
    motherMemberId: optionalMemberIdSchema,
    spouseMemberId: optionalMemberIdSchema
  })
  .optional()
  .refine(
    (value) =>
      !value?.fatherMemberId ||
      !value?.motherMemberId ||
      value.fatherMemberId !== value.motherMemberId,
    {
      message: "Father and mother cannot be the same member.",
      path: ["motherMemberId"]
    }
  );

const memberFormBaseSchema = z.object({
  fullName: z.preprocess(emptyToUndefined, z.string().trim().min(1).optional()),
  alias: z.preprocess(emptyToUndefined, z.string().trim().min(1).optional()),
  gender: z.nativeEnum(MemberGender),
  visibility: z.nativeEnum(VisibilityStatus).optional(),
  isFamilyHead: z.boolean().optional().default(false),
  city: z.preprocess(emptyToUndefined, z.string().trim().optional()),
  phone: z.preprocess(emptyToUndefined, z.string().trim().optional()),
  profession: z.preprocess(emptyToUndefined, z.string().trim().optional()),
  branchLabel: z.preprocess(emptyToUndefined, z.string().trim().optional()),
  dateOfBirth: z.preprocess(emptyToUndefined, z.string().optional()),
  notes: z.preprocess(emptyToUndefined, z.string().trim().optional()),
  createLogin: z.boolean().optional().default(false),
  username: z.preprocess(emptyToUndefined, z.string().trim().min(1).optional()),
  role: z.nativeEnum(UserRole).optional().default(UserRole.MEMBER),
  relationships: createRelationshipsSchema
});

export const createMemberSchema = memberFormBaseSchema.refine((value) => value.fullName || value.alias, {
  message: "Either fullName or alias is required.",
  path: ["fullName"]
}).refine((value) => !value.createLogin || value.username, {
  message: "username is required when creating login access.",
  path: ["username"]
});

export const updateMemberSchema = memberFormBaseSchema
  .omit({ createLogin: true, username: true, role: true, relationships: true })
  .partial()
  .extend({
    status: z.nativeEnum(MemberStatus).optional()
  });

export const memberListQuerySchema = z.object({
  search: z.string().optional(),
  status: z.nativeEnum(MemberStatus).optional(),
  gender: z.nativeEnum(MemberGender).optional(),
  visibility: z.nativeEnum(VisibilityStatus).optional(),
  role: z.nativeEnum(UserRole).optional(),
  hasLogin: z.enum(["true", "false"]).optional(),
  isFamilyHead: z.enum(["true", "false"]).optional()
});

export const generateLoginSchema = z.object({
  username: z.string().trim().min(1),
  role: z.nativeEnum(UserRole).default(UserRole.MEMBER),
  temporaryPassword: z.string().min(8).optional()
});
