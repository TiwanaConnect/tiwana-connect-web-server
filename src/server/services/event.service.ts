import type { EventStatus, EventType, EventVisibility, Prisma, UserRole } from "@prisma/client";
import { EventInviteSource, RSVPStatus } from "@prisma/client";

import { API_ERROR_CODES, AppError } from "@/lib/api/errors";
import { prisma } from "@/lib/db/prisma";
import { toAdminFamilyEventDto, toMobileFamilyEventDto, rsvpSummary } from "@/server/dto/event.dto";
import { eventInclude, findEventById } from "@/server/repositories/event.repository";
import { notifyMembers } from "@/server/services/notification.service";

import { recordAuditLog } from "./audit.service";

type EventPayload = {
  title: string;
  description?: string | null;
  type?: EventType;
  startAt: string;
  endAt?: string | null;
  timezone?: string;
  locationName?: string | null;
  locationAddress?: string | null;
  mapUrl?: string | null;
  visibility: EventVisibility;
  inviteAudience?: "ALL_FAMILY" | "ALL_MALES" | "ALL_FEMALES" | "MANUAL" | "BRANCH";
  invitedMemberIds?: string[];
  familyHeadMemberIds?: string[];
  isOfficial?: boolean;
  isPinned?: boolean;
};

function parseDate(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new AppError(API_ERROR_CODES.VALIDATION_ERROR, "Invalid date.", 400);
  }
  return date;
}

async function getActiveInviteMemberIds(input: {
  visibility: EventVisibility;
  inviteAudience?: EventPayload["inviteAudience"];
  invitedMemberIds?: string[];
}) {
  const audience = input.inviteAudience ?? (input.visibility === "ALL_FAMILY" ? "ALL_FAMILY" : "MANUAL");

  if (audience === "ALL_FAMILY") {
    const members = await prisma.member.findMany({
      where: { deletedAt: null, status: "ACTIVE" },
      select: { id: true }
    });
    return members.map((member) => member.id);
  }

  if (audience === "ALL_MALES" || audience === "ALL_FEMALES") {
    const members = await prisma.member.findMany({
      where: {
        deletedAt: null,
        status: "ACTIVE",
        gender: audience === "ALL_MALES" ? "MALE" : "FEMALE"
      },
      select: { id: true }
    });
    return members.map((member) => member.id);
  }

  const ids = [...new Set(input.invitedMemberIds ?? [])];
  if (ids.length === 0) return [];

  const members = await prisma.member.findMany({
    where: {
      id: { in: ids },
      deletedAt: null,
      status: "ACTIVE"
    },
    select: { id: true }
  });
  return members.map((member) => member.id);
}

function inviteSourceForAudience(
  visibility: EventVisibility,
  audience?: EventPayload["inviteAudience"]
): (typeof EventInviteSource)[keyof typeof EventInviteSource] {
  if (audience === "ALL_MALES") return EventInviteSource.ALL_MALES;
  if (audience === "ALL_FEMALES") return EventInviteSource.ALL_FEMALES;
  if (audience === "ALL_FAMILY" || visibility === "ALL_FAMILY") return EventInviteSource.ALL_FAMILY;
  if (audience === "BRANCH" || visibility === "BRANCH_ONLY") return EventInviteSource.BRANCH;
  return EventInviteSource.MANUAL;
}

export async function listAdminEvents(filters: {
  q?: string;
  status?: EventStatus;
  type?: EventType;
  isOfficial?: "true" | "false";
  isPinned?: "true" | "false";
  createdById?: string;
  fromDate?: string;
  toDate?: string;
  limit: number;
  cursor?: string;
}) {
  const where: Prisma.FamilyEventWhereInput = {
    deletedAt: null,
    ...(filters.q
      ? {
          OR: [
            { title: { contains: filters.q, mode: "insensitive" } },
            { description: { contains: filters.q, mode: "insensitive" } },
            { locationName: { contains: filters.q, mode: "insensitive" } }
          ]
        }
      : {}),
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.type ? { type: filters.type } : {}),
    ...(filters.isOfficial ? { isOfficial: filters.isOfficial === "true" } : {}),
    ...(filters.isPinned ? { isPinned: filters.isPinned === "true" } : {}),
    ...(filters.createdById ? { createdById: filters.createdById } : {}),
    ...(filters.fromDate || filters.toDate
      ? {
          startAt: {
            ...(filters.fromDate ? { gte: parseDate(filters.fromDate) ?? undefined } : {}),
            ...(filters.toDate ? { lte: parseDate(filters.toDate) ?? undefined } : {})
          }
        }
      : {})
  };
  const events = await prisma.familyEvent.findMany({
    where,
    include: eventInclude,
    orderBy: [{ isPinned: "desc" }, { startAt: "desc" }],
    ...(filters.cursor ? { cursor: { id: filters.cursor }, skip: 1 } : {}),
    take: filters.limit + 1
  });

  return {
    events: events.slice(0, filters.limit).map(toAdminFamilyEventDto),
    nextCursor: events.length > filters.limit ? events[filters.limit]?.id ?? null : null
  };
}

export async function listMobileEvents(input: {
  memberId: string;
  role: UserRole;
  status: "upcoming" | "past" | "cancelled" | "all";
  limit: number;
  cursor?: string;
}) {
  const now = new Date();
  const events = await prisma.familyEvent.findMany({
    where: {
      deletedAt: null,
      OR: [
        { createdById: input.memberId },
        { invites: { some: { memberId: input.memberId } } },
        { visibility: "ALL_FAMILY", status: "PUBLISHED" }
      ],
      ...(input.status === "cancelled"
        ? { status: "CANCELLED" }
        : input.status === "upcoming"
          ? { status: "PUBLISHED", startAt: { gte: now } }
          : input.status === "past"
            ? { status: { in: ["PUBLISHED", "COMPLETED"] }, startAt: { lt: now } }
            : {})
    },
    include: eventInclude,
    orderBy:
      input.status === "past"
        ? [{ isPinned: "desc" }, { startAt: "desc" }]
        : [{ isPinned: "desc" }, { startAt: "asc" }],
    ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
    take: input.limit + 1
  });

  return {
    events: events
      .slice(0, input.limit)
      .map((event) => toMobileFamilyEventDto(event, input.role, input.memberId)),
    nextCursor: events.length > input.limit ? events[input.limit]?.id ?? null : null
  };
}

export async function getEventDetail(input: {
  eventId: string;
  viewerMemberId: string;
  viewerRole: UserRole;
  admin?: boolean;
}) {
  const event = await findEventById(input.eventId);
  if (!event || event.deletedAt) {
    throw new AppError(API_ERROR_CODES.NOT_FOUND, "Event not found.", 404);
  }

  const invite = event.invites.find((item) => item.memberId === input.viewerMemberId);
  const canView =
    input.admin ||
    event.createdById === input.viewerMemberId ||
    event.visibility === "ALL_FAMILY" ||
    Boolean(invite);

  if (!canView) {
    throw new AppError(API_ERROR_CODES.FORBIDDEN, "You cannot view this event.", 403);
  }

  if (input.admin) {
    return {
      event: toAdminFamilyEventDto(event),
      invites: event.invites.map((item) => ({
        id: item.id,
        memberId: item.memberId,
        memberName: item.member?.fullName ?? item.member?.alias ?? item.memberId,
        source: item.source,
        rsvpStatus: item.rsvpStatus,
        rsvpNote: item.rsvpNote,
        respondedAt: item.respondedAt?.toISOString() ?? null
      })),
      summary: rsvpSummary(event)
    };
  }

  return {
    event: toMobileFamilyEventDto(event, input.viewerRole, input.viewerMemberId),
    invites: rsvpSummary(event),
    currentUserInvite: invite
      ? {
          rsvpStatus: invite.rsvpStatus.toLowerCase().replace("not_going", "not_going"),
          rsvpNote: invite.rsvpNote
        }
      : null
  };
}

export async function createEvent(input: EventPayload & {
  actorMemberId: string;
  admin?: boolean;
}) {
  const creator = await prisma.member.findUnique({ where: { id: input.actorMemberId } });
  if (!creator || creator.deletedAt || creator.status === "BLOCKED") {
    throw new AppError(API_ERROR_CODES.FORBIDDEN, "Blocked or inactive members cannot create events.", 403);
  }

  const invitedIds = await getActiveInviteMemberIds({
    visibility: input.visibility,
    inviteAudience: input.inviteAudience,
    invitedMemberIds: input.invitedMemberIds
  });
  const finalInviteIds = [...new Set([input.actorMemberId, ...invitedIds])];
  const source = inviteSourceForAudience(input.visibility, input.inviteAudience);

  const event = await prisma.$transaction(async (tx) => {
    const created = await tx.familyEvent.create({
      data: {
        title: input.title,
        description: input.description,
        type: input.type ?? "FAMILY_EVENT",
        status: "PUBLISHED",
        visibility: input.visibility,
        isOfficial: input.admin ? input.isOfficial ?? true : false,
        isPinned: input.admin ? input.isPinned ?? false : false,
        startAt: parseDate(input.startAt) ?? new Date(),
        endAt: parseDate(input.endAt),
        timezone: input.timezone ?? "Asia/Karachi",
        locationName: input.locationName,
        locationAddress: input.locationAddress,
        mapUrl: input.mapUrl,
        createdById: input.actorMemberId
      }
    });
    await tx.eventInvite.createMany({
      data: finalInviteIds.map((memberId) => ({
        eventId: created.id,
        memberId,
        source,
        invitedById: input.actorMemberId,
        rsvpStatus: memberId === input.actorMemberId ? RSVPStatus.GOING : RSVPStatus.PENDING,
        respondedAt: memberId === input.actorMemberId ? new Date() : null
      })),
      skipDuplicates: true
    });
    await tx.auditLog.create({
      data: {
        actorMemberId: input.actorMemberId,
        action: input.admin ? "OFFICIAL_EVENT_CREATED" : "EVENT_CREATED",
        entityType: "EVENT",
        entityId: created.id
      }
    });
    return tx.familyEvent.findUniqueOrThrow({ where: { id: created.id }, include: eventInclude });
  });

  await notifyMembers({
    memberIds: finalInviteIds,
    type: "EVENT_INVITE",
    title: `Event invite: ${event.title}`,
    body: "You have been invited to a family event.",
    entityType: "EVENT",
    entityId: event.id,
    actionLabel: "View event",
    actionUrl: `/events/${event.id}`,
    priority: "HIGH",
    push: true
  });
  return input.admin
    ? toAdminFamilyEventDto(event)
    : toMobileFamilyEventDto(event, "MEMBER", input.actorMemberId);
}

export async function updateEvent(eventId: string, input: Partial<EventPayload> & {
  status?: EventStatus;
  actorMemberId: string;
  admin?: boolean;
}) {
  const event = await prisma.familyEvent.update({
    where: { id: eventId },
    data: {
      title: input.title,
      description: input.description,
      type: input.type,
      startAt: input.startAt ? parseDate(input.startAt) ?? undefined : undefined,
      endAt: input.endAt === null ? null : input.endAt ? parseDate(input.endAt) : undefined,
      timezone: input.timezone,
      locationName: input.locationName,
      locationAddress: input.locationAddress,
      mapUrl: input.mapUrl,
      visibility: input.visibility,
      status: input.status,
      isOfficial: input.admin ? input.isOfficial : undefined,
      isPinned: input.admin ? input.isPinned : undefined,
      updatedById: input.actorMemberId
    },
    include: eventInclude
  });
  await recordAuditLog({
    actorMemberId: input.actorMemberId,
    action: "EVENT_UPDATED",
    entityType: "EVENT",
    entityId: eventId
  });
  await notifyMembers({
    memberIds: event.invites.map((invite) => invite.memberId),
    type: "EVENT_UPDATED",
    title: `Event updated: ${event.title}`,
    body: "Event details were updated.",
    entityType: "EVENT",
    entityId: event.id,
    actionLabel: "View event",
    actionUrl: `/events/${event.id}`,
    priority: "NORMAL",
    push: true
  });
  return toAdminFamilyEventDto(event);
}

export async function cancelEvent(eventId: string, actorMemberId: string, reason?: string | null) {
  const event = await prisma.familyEvent.update({
    where: { id: eventId },
    data: {
      status: "CANCELLED",
      cancelledAt: new Date(),
      cancelledById: actorMemberId,
      cancelReason: reason
    },
    include: eventInclude
  });
  await recordAuditLog({ actorMemberId, action: "EVENT_CANCELLED", entityType: "EVENT", entityId: eventId });
  await notifyMembers({
    memberIds: event.invites.map((invite) => invite.memberId),
    type: "EVENT_CANCELLED",
    title: `Event cancelled: ${event.title}`,
    body: reason ? "An event was cancelled. Open it for details." : "An event was cancelled.",
    entityType: "EVENT",
    entityId: event.id,
    actionLabel: "View event",
    actionUrl: `/events/${event.id}`,
    priority: "HIGH",
    push: true
  });
  return toAdminFamilyEventDto(event);
}

export async function setEventPinned(eventId: string, actorMemberId: string, isPinned: boolean) {
  const event = await prisma.familyEvent.update({
    where: { id: eventId },
    data: { isPinned },
    include: eventInclude
  });
  await recordAuditLog({ actorMemberId, action: isPinned ? "EVENT_PINNED" : "EVENT_UNPINNED", entityType: "EVENT", entityId: eventId });
  return toAdminFamilyEventDto(event);
}

export async function addEventInvites(eventId: string, actorMemberId: string, memberIds: string[]) {
  const event = await prisma.familyEvent.findUnique({ where: { id: eventId }, select: { id: true, title: true } });
  if (!event) throw new AppError(API_ERROR_CODES.NOT_FOUND, "Event not found.", 404);
  const activeMembers = await prisma.member.findMany({
    where: { id: { in: [...new Set(memberIds)] }, deletedAt: null, status: "ACTIVE" },
    select: { id: true }
  });
  await prisma.eventInvite.createMany({
    data: activeMembers.map((member) => ({
      eventId,
      memberId: member.id,
      invitedById: actorMemberId,
      source: "MANUAL" as const
    })),
    skipDuplicates: true
  });
  await recordAuditLog({ actorMemberId, action: "EVENT_INVITES_ADDED", entityType: "EVENT", entityId: eventId, metadata: { count: activeMembers.length } });
  await notifyMembers({
    memberIds: activeMembers.map((member) => member.id),
    type: "EVENT_INVITE",
    title: `Event invite: ${event.title}`,
    body: "You have been invited to a family event.",
    entityType: "EVENT",
    entityId: event.id,
    actionLabel: "View event",
    actionUrl: `/events/${event.id}`,
    priority: "HIGH",
    push: true
  });
  return getEventDetail({ eventId, viewerMemberId: actorMemberId, viewerRole: "SUPER_ADMIN", admin: true });
}

export async function removeEventInvite(eventId: string, inviteId: string, actorMemberId: string) {
  await prisma.eventInvite.delete({ where: { id: inviteId } });
  await recordAuditLog({ actorMemberId, action: "EVENT_INVITE_REMOVED", entityType: "EVENT", entityId: eventId });
  return { ok: true };
}
