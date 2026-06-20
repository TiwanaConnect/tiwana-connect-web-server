import { HelpRequestPriority, HelpRequestStatus } from "@prisma/client";
import { z } from "zod";

const emptyToUndefined = (value: unknown) => (value === "" ? undefined : value);
const nullableString = z.preprocess(
  emptyToUndefined,
  z.string().trim().min(1).nullable().optional()
);

export const sendHelpRequestSchema = z.object({
  title: z.string().trim().min(1),
  message: z.string().trim().min(1),
  category: nullableString,
  priority: z.nativeEnum(HelpRequestPriority).default(HelpRequestPriority.NORMAL)
});

export const respondHelpRequestSchema = z.object({
  status: z.enum(["ACCEPTED", "DECLINED"]),
  responseMessage: nullableString
});

export const updateHelpRequestSchema = z.object({
  status: z.nativeEnum(HelpRequestStatus).optional(),
  priority: z.nativeEnum(HelpRequestPriority).optional(),
  category: nullableString,
  responseMessage: nullableString
});

export const helpRequestListQuerySchema = z.object({
  q: z.string().optional(),
  status: z.nativeEnum(HelpRequestStatus).optional(),
  priority: z.nativeEnum(HelpRequestPriority).optional(),
  category: z.string().optional(),
  memberId: z.string().optional(),
  fromMemberId: z.string().optional(),
  toMemberId: z.string().optional(),
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  cursor: z.preprocess(emptyToUndefined, z.string().optional())
});
