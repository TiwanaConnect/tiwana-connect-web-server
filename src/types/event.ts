export type MobileEventStatus = "upcoming" | "past" | "cancelled";
export type MobileRSVPStatus = "going" | "maybe" | "not_going" | "pending";

export type MobileFamilyEvent = {
  id: string;
  title: string;
  description: string | null;
  date: string;
  startAt: string;
  endAt: string | null;
  timezone: string;
  location: string | null;
  locationAddress?: string | null;
  mapUrl?: string | null;
  createdByMemberId: string;
  createdByDisplayName: string;
  isOfficial: boolean;
  isPinned: boolean;
  status: MobileEventStatus;
  rsvpStatus?: MobileRSVPStatus;
  invitedCount: number;
  goingCount: number;
  maybeCount: number;
  notGoingCount: number;
};

export type AdminFamilyEventDto = {
  id: string;
  title: string;
  description: string | null;
  type: string;
  status: string;
  visibility: string;
  isOfficial: boolean;
  isPinned: boolean;
  startAt: string;
  endAt: string | null;
  timezone: string;
  locationName: string | null;
  locationAddress: string | null;
  mapUrl: string | null;
  createdBy: {
    id: string;
    displayName: string;
  };
  invitedCount: number;
  goingCount: number;
  maybeCount: number;
  notGoingCount: number;
  pendingCount: number;
  createdAt: string;
  updatedAt: string;
};
