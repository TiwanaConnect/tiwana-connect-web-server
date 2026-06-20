import { EventStatus, EventType, EventVisibility } from "@prisma/client";
import { z } from "zod";

const emptyToUndefined = (value: unknown) => (value === "" ? undefined : value);
const nullableString = z.preprocess(
  emptyToUndefined,
  z.string().trim().min(1).nullable().optional()
);

const eventBaseObject = z.object({
  title: z.string().trim().min(1),
  description: nullableString,
  type: z.nativeEnum(EventType).default(EventType.FAMILY_EVENT),
  startAt: z.string().min(1),
  endAt: z.preprocess(emptyToUndefined, z.string().optional()),
  timezone: z.string().trim().default("Asia/Karachi"),
  locationName: nullableString,
  locationAddress: nullableString,
  mapUrl: z.preprocess(emptyToUndefined, z.string().url().nullable().optional()),
  visibility: z.nativeEnum(EventVisibility),
  inviteAudience: z
    .enum(["ALL_FAMILY", "ALL_MALES", "ALL_FEMALES", "MANUAL", "BRANCH"])
    .optional()
    .default("MANUAL"),
  invitedMemberIds: z.array(z.string().min(1)).optional().default([]),
  familyHeadMemberIds: z.array(z.string().min(1)).optional().default([])
});

function withDateRules<T extends z.ZodTypeAny>(schema: T) {
  return schema.refine(
    (value) => {
      const event = value as { startAt?: string; endAt?: string };
      return !event.endAt || !event.startAt || new Date(event.endAt) > new Date(event.startAt);
    },
    {
      message: "endAt must be after startAt.",
      path: ["endAt"]
    }
  );
}

export const createAdminEventSchema = withDateRules(
  eventBaseObject.extend({
    isOfficial: z.boolean().optional().default(true),
    isPinned: z.boolean().optional().default(false)
  })
);

export const createMobileEventSchema = withDateRules(
  eventBaseObject
    .extend({
      type: z
        .enum(["FAMILY_EVENT", "WEDDING", "EID_GATHERING", "REUNION", "OTHER"])
        .default("FAMILY_EVENT"),
      visibility: z.enum(["ALL_FAMILY", "INVITED_ONLY"])
    })
    .transform((value) => ({
      ...value,
      type: value.type as EventType,
      visibility: value.visibility as EventVisibility
    }))
);

export const updateEventSchema = withDateRules(
  eventBaseObject.partial().extend({
    status: z.nativeEnum(EventStatus).optional(),
    isOfficial: z.boolean().optional(),
    isPinned: z.boolean().optional()
  })
);

export const rsvpSchema = z.object({
  status: z.enum(["going", "maybe", "not_going"]),
  note: nullableString
});

export const cancelEventSchema = z.object({
  reason: nullableString
});

export const inviteMembersSchema = z.object({
  memberIds: z.array(z.string().min(1)).min(1)
});

export const mobileEventListQuerySchema = z.object({
  status: z.enum(["upcoming", "past", "cancelled", "all"]).default("upcoming"),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  cursor: z.preprocess(emptyToUndefined, z.string().optional())
});

export const adminEventListQuerySchema = z.object({
  q: z.string().optional(),
  status: z.nativeEnum(EventStatus).optional(),
  type: z.nativeEnum(EventType).optional(),
  isOfficial: z.enum(["true", "false"]).optional(),
  isPinned: z.enum(["true", "false"]).optional(),
  createdById: z.string().optional(),
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  cursor: z.preprocess(emptyToUndefined, z.string().optional())
});
