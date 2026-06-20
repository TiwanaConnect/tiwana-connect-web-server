import type { FamilyEvent, EventInvite, Member, RSVPStatus, UserAccount } from "@prisma/client";
import type { AdminFamilyEventDto, MobileEventStatus, MobileFamilyEvent, MobileRSVPStatus } from "@/types/event";
import { getMemberDisplayNameForViewer } from "@/lib/privacy/member-display";

type EventWithRelations = FamilyEvent & {
  createdBy: Member & { userAccount?: UserAccount | null };
  invites: Array<EventInvite & { member?: Member & { userAccount?: UserAccount | null } }>;
};

function counts(event: EventWithRelations) {
  return {
    invitedCount: event.invites.length,
    goingCount: event.invites.filter((invite) => invite.rsvpStatus === "GOING").length,
    maybeCount: event.invites.filter((invite) => invite.rsvpStatus === "MAYBE").length,
    notGoingCount: event.invites.filter((invite) => invite.rsvpStatus === "NOT_GOING").length,
    pendingCount: event.invites.filter((invite) => invite.rsvpStatus === "PENDING").length
  };
}

export function toMobileEventStatus(event: FamilyEvent): MobileEventStatus {
  if (event.status === "CANCELLED") return "cancelled";
  if (event.startAt < new Date()) return "past";
  return "upcoming";
}

export function toMobileRsvpStatus(status: RSVPStatus): MobileRSVPStatus {
  if (status === "GOING") return "going";
  if (status === "MAYBE") return "maybe";
  if (status === "NOT_GOING") return "not_going";
  return "pending";
}

export function fromMobileRsvpStatus(status: "going" | "maybe" | "not_going"): RSVPStatus {
  if (status === "going") return "GOING";
  if (status === "maybe") return "MAYBE";
  return "NOT_GOING";
}

export function toMobileFamilyEventDto(event: EventWithRelations, viewerRole: UserAccount["role"], viewerMemberId: string): MobileFamilyEvent {
  const summary = counts(event);
  const currentInvite = event.invites.find((invite) => invite.memberId === viewerMemberId);

  return {
    id: event.id,
    title: event.title,
    description: event.description,
    date: event.startAt.toISOString(),
    startAt: event.startAt.toISOString(),
    endAt: event.endAt?.toISOString() ?? null,
    timezone: event.timezone,
    location: event.locationName,
    locationAddress: event.locationAddress,
    mapUrl: event.mapUrl,
    createdByMemberId: event.createdById,
    createdByDisplayName: getMemberDisplayNameForViewer(event.createdBy, viewerRole),
    isOfficial: event.isOfficial,
    isPinned: event.isPinned,
    status: toMobileEventStatus(event),
    rsvpStatus: currentInvite ? toMobileRsvpStatus(currentInvite.rsvpStatus) : undefined,
    invitedCount: summary.invitedCount,
    goingCount: summary.goingCount,
    maybeCount: summary.maybeCount,
    notGoingCount: summary.notGoingCount
  };
}

export function toAdminFamilyEventDto(event: EventWithRelations): AdminFamilyEventDto {
  const summary = counts(event);

  return {
    id: event.id,
    title: event.title,
    description: event.description,
    type: event.type,
    status: event.status,
    visibility: event.visibility,
    isOfficial: event.isOfficial,
    isPinned: event.isPinned,
    startAt: event.startAt.toISOString(),
    endAt: event.endAt?.toISOString() ?? null,
    timezone: event.timezone,
    locationName: event.locationName,
    locationAddress: event.locationAddress,
    mapUrl: event.mapUrl,
    createdBy: {
      id: event.createdById,
      displayName: event.createdBy.fullName ?? event.createdBy.alias ?? event.createdBy.initials
    },
    ...summary,
    createdAt: event.createdAt.toISOString(),
    updatedAt: event.updatedAt.toISOString()
  };
}

export function rsvpSummary(event: EventWithRelations) {
  const summary = counts(event);
  return {
    going: summary.goingCount,
    maybe: summary.maybeCount,
    notGoing: summary.notGoingCount,
    pending: summary.pendingCount
  };
}
