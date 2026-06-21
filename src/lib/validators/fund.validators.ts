import {
  ContributionRequestStatus,
  FundPaymentMethod,
  FundStatus,
  FundTransactionStatus,
  FundTransactionType,
  FundType,
  FundVisibility
} from "@prisma/client";
import { z } from "zod";

const emptyToUndefined = (value: unknown) => (value === "" ? undefined : value);
const nullableString = z.preprocess(
  emptyToUndefined,
  z.string().trim().min(1).nullable().optional()
);
const optionalDate = z.preprocess(emptyToUndefined, z.string().optional());
const decimalString = z.preprocess(
  emptyToUndefined,
  z.coerce.number().positive().finite().transform((value) => value.toFixed(2)).optional()
);
const requiredDecimalString = z.preprocess(
  emptyToUndefined,
  z.coerce.number().positive().finite().transform((value) => value.toFixed(2))
);
const nullableDecimalString = z.preprocess(
  emptyToUndefined,
  z.coerce.number().positive().finite().transform((value) => value.toFixed(2)).nullable().optional()
);

const fundBaseObject = z.object({
  title: z.string().trim().min(1),
  description: nullableString,
  type: z.nativeEnum(FundType).default(FundType.FAMILY_GENERAL),
  visibility: z.nativeEnum(FundVisibility).default(FundVisibility.ALL_FAMILY),
  targetAmount: nullableDecimalString,
  currency: z.string().trim().min(3).max(3).default("PKR"),
  isOfficial: z.boolean().optional().default(false),
  isPinned: z.boolean().optional().default(false),
  startAt: optionalDate,
  endAt: optionalDate,
  relatedEventId: z.preprocess(emptyToUndefined, z.string().optional())
});

function withDateRules<T extends z.ZodTypeAny>(schema: T) {
  return schema.refine(
    (value) => {
      const fund = value as { startAt?: string; endAt?: string };
      return !fund.startAt || !fund.endAt || new Date(fund.endAt) > new Date(fund.startAt);
    },
    { message: "endAt must be after startAt.", path: ["endAt"] }
  );
}

export const createAdminFundSchema = withDateRules(
  fundBaseObject.extend({
    status: z.nativeEnum(FundStatus).optional().default(FundStatus.ACTIVE),
    isOfficial: z.boolean().optional().default(true)
  }).refine((value) => value.type === FundType.FAMILY_GENERAL, {
    message: "Admin can only create family funds.",
    path: ["type"]
  })
);

export const createMobileFundSchema = withDateRules(
  fundBaseObject
    .extend({
      type: z.literal(FundType.GENERAL).default(FundType.GENERAL),
      visibility: z.enum(["ALL_FAMILY", "INVITED_ONLY"]).default("ALL_FAMILY")
    })
    .transform((value) => ({ ...value, visibility: value.visibility as FundVisibility, isOfficial: false, isPinned: false }))
);

export const updateFundSchema = withDateRules(
  fundBaseObject.partial().extend({
    status: z.nativeEnum(FundStatus).optional()
  })
);

const fundTransactionBaseObject = z.object({
  type: z.nativeEnum(FundTransactionType),
  status: z.nativeEnum(FundTransactionStatus).optional().default(FundTransactionStatus.PENDING),
  amount: requiredDecimalString,
  currency: z.string().trim().min(3).max(3).default("PKR"),
  contributorId: z.preprocess(emptyToUndefined, z.string().optional()),
  recipientMemberId: z.preprocess(emptyToUndefined, z.string().optional()),
  paymentMethod: z.nativeEnum(FundPaymentMethod).optional(),
  referenceNumber: nullableString,
  note: nullableString,
  requestId: z.preprocess(emptyToUndefined, z.string().optional())
});

export const createFundTransactionSchema = fundTransactionBaseObject;

export const createMobileContributionSchema = fundTransactionBaseObject
  .pick({ amount: true, currency: true, paymentMethod: true, referenceNumber: true, note: true, requestId: true })
  .extend({ type: z.enum(["CONTRIBUTION", "ZAKAT_INCOME", "SADAQAH_INCOME"]).default("CONTRIBUTION") })
  .transform((value) => ({ ...value, type: value.type as FundTransactionType }));

export const createContributionRequestsSchema = z.object({
  memberIds: z.array(z.string().min(1)).min(1),
  requestedAmount: nullableDecimalString,
  currency: z.string().trim().min(3).max(3).default("PKR"),
  note: nullableString
});

export const createMobileContributionRequestSchema = z.object({
  requestedAmount: nullableDecimalString,
  currency: z.string().trim().min(3).max(3).default("PKR"),
  note: nullableString
});

export const updateContributionRequestSchema = z.object({
  requestedAmount: nullableDecimalString,
  paidAmount: z.preprocess(
    emptyToUndefined,
    z.coerce.number().min(0).finite().transform((value) => value.toFixed(2)).optional()
  ),
  status: z.nativeEnum(ContributionRequestStatus).optional(),
  note: nullableString
});

export const rejectFundTransactionSchema = z.object({
  reason: nullableString
});

export const fundListQuerySchema = z.object({
  q: z.string().optional(),
  status: z.nativeEnum(FundStatus).optional(),
  type: z.nativeEnum(FundType).optional(),
  visibility: z.nativeEnum(FundVisibility).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  cursor: z.preprocess(emptyToUndefined, z.string().optional())
});

export const fundTransactionListQuerySchema = z.object({
  fundId: z.string().optional(),
  status: z.nativeEnum(FundTransactionStatus).optional(),
  type: z.nativeEnum(FundTransactionType).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  cursor: z.preprocess(emptyToUndefined, z.string().optional())
});

export const contributionRequestListQuerySchema = z.object({
  fundId: z.string().optional(),
  status: z.nativeEnum(ContributionRequestStatus).optional(),
  memberId: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  cursor: z.preprocess(emptyToUndefined, z.string().optional())
});
