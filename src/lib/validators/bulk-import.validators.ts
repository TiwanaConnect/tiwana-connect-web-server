import { MemberGender, UserRole, VisibilityStatus } from "@prisma/client";
import { z } from "zod";

export const bulkTextSchema = z.object({
  csv: z.string().min(1)
});

export const bulkMemberRowSchema = z.object({
  fullName: z.string().optional(),
  alias: z.string().optional(),
  gender: z.nativeEnum(MemberGender),
  visibility: z.nativeEnum(VisibilityStatus).optional(),
  isFamilyHead: z.boolean().optional().default(false),
  city: z.string().optional(),
  phone: z.string().optional(),
  profession: z.string().optional(),
  branchLabel: z.string().optional(),
  dateOfBirth: z.string().optional(),
  notes: z.string().optional(),
  createLogin: z.boolean().optional().default(false),
  username: z.string().optional(),
  role: z.nativeEnum(UserRole).optional().default(UserRole.MEMBER)
}).refine((value) => value.fullName || value.alias, {
  message: "fullName or alias is required.",
  path: ["fullName"]
}).refine((value) => !value.createLogin || value.username, {
  message: "username is required when createLogin is true.",
  path: ["username"]
});
