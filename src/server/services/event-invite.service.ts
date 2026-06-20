import type { UserRole } from "@prisma/client";

import { API_ERROR_CODES, AppError } from "@/lib/api/errors";
import { prisma } from "@/lib/db/prisma";
import { fromMobileRsvpStatus, toMobileFamilyEventDto } from "@/server/dto/event.dto";
import { eventInclude, findEventById } from "@/server/repositories/event.repository";

import { recordAuditLog } from "./audit.service";

export async function rsvpToEvent(input: {
  eventId: string;
  memberId: string;
  role: UserRole;
  status: "going" | "maybe" | "not_going";
  note?: string | null;
}) {
  const member = await prisma.member.findUnique({ where: { id: input.memberId } });
  if (!member || member.deletedAt || member.status === "BLOCKED") {
    throw new AppError(API_ERROR_CODES.FORBIDDEN, "Blocked or inactive members cannot RSVP.", 403);
  }

  const event = await findEventById(input.eventId);
  if (!event || event.deletedAt) {
    throw new AppError(API_ERROR_CODES.NOT_FOUND, "Event not found.", 404);
  }

  const existingInvite = event.invites.find((invite) => invite.memberId === input.memberId);
  if (!existingInvite && event.visibility !== "ALL_FAMILY" && event.createdById !== input.memberId) {
    throw new AppError(API_ERROR_CODES.FORBIDDEN, "You are not invited to this event.", 403);
  }

  await prisma.eventInvite.upsert({
    where: { eventId_memberId: { eventId: input.eventId, memberId: input.memberId } },
    update: {
      rsvpStatus: fromMobileRsvpStatus(input.status),
      rsvpNote: input.note,
      respondedAt: new Date()
    },
    create: {
      eventId: input.eventId,
      memberId: input.memberId,
      source: event.visibility === "ALL_FAMILY" ? "ALL_FAMILY" : "MANUAL",
      rsvpStatus: fromMobileRsvpStatus(input.status),
      rsvpNote: input.note,
      respondedAt: new Date()
    }
  });

  await recordAuditLog({
    actorMemberId: input.memberId,
    action: "EVENT_RSVP_UPDATED",
    entityType: "EVENT",
    entityId: input.eventId
  });

  const updated = await prisma.familyEvent.findUniqueOrThrow({
    where: { id: input.eventId },
    include: eventInclude
  });

  return toMobileFamilyEventDto(updated, input.role, input.memberId);
}
