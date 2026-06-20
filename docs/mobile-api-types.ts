// Tiwana Connect mobile API handoff types.
// This file is standalone for the separate Expo mobile repo. Do not import Prisma types here.

export type ApiError = {
  code: string;
  message: string;
  details?: unknown;
};

export type ApiResponse<T> = {
  data: T | null;
  error: ApiError | null;
};

export type PaginatedResponse<TItem, TKey extends string = "items"> = {
  nextCursor: string | null;
} & Record<TKey, TItem[]>;

export type AuthRole = "SUPER_ADMIN" | "PRESIDENT" | "MEMBER";

export type AuthUser = {
  id: string;
  memberId: string;
  username: string;
  role: AuthRole;
  mustChangePassword?: boolean;
  displayName?: string;
  isActive?: boolean;
};

export type LoginResponse = {
  user: AuthUser & {
    mustChangePassword: boolean;
    displayName: string;
  };
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
};

export type MobileMemberDto = {
  id: string;
  displayName: string;
  initials: string;
  gender: "MALE" | "FEMALE";
  visibility: "VISIBLE" | "HIDDEN";
  status: "ACTIVE" | "BLOCKED" | "PENDING";
  city: string | null;
  profession: string | null;
  branchLabel: string | null;
};

export type MeResponse = {
  user: AuthUser & { mustChangePassword: boolean };
  member: MobileMemberDto;
};

export type MobileRelationshipType =
  | "father"
  | "mother"
  | "spouse"
  | "child"
  | "sibling"
  | "guardian"
  | "other";

export type TreeViewMode = "close" | "branch" | "full" | "relationship";

export type MemberNode = {
  id: string;
  name: string | null;
  alias: string | null;
  displayName: string;
  initials: string;
  gender: "male" | "female";
  visibility: "visible" | "hidden";
  status: "active" | "blocked" | "pending";
  relationshipLabel: string;
  localRelationshipLabel?: string | null;
  city: string | null;
  profession?: string | null;
  branchLabel?: string | null;
  isCurrentUser?: boolean;
  isFamilyHead?: boolean;
  isPresident?: boolean;
  isAdmin?: boolean;
  isPrivate?: boolean;
};

export type TreeNodePosition = {
  memberId: string;
  x: number;
  y: number;
};

export type TreeConnection = {
  id: string;
  fromMemberId: string;
  toMemberId: string;
  type: MobileRelationshipType;
  isBidirectional?: boolean;
};

export type FamilyTreeResponse = {
  rootMemberId: string;
  currentUserId: string;
  focusMemberId: string;
  members: MemberNode[];
  positions: TreeNodePosition[];
  connections: TreeConnection[];
  expandedMemberIds: string[];
  standaloneMemberIds?: string[];
  meta: {
    generationDepth: number;
    viewMode: TreeViewMode;
    totalMembers: number;
    totalConnections: number;
  };
};

export type RelationshipTreeResponse = {
  startMemberId: string;
  targetMemberId: string;
  relationshipLabel: string;
  localRelationshipLabel?: string | null;
  side: "father" | "mother" | "both" | "spouse" | "unknown";
  pathText: string;
  pathMemberIds: string[];
  pathConnectionIds: string[];
  tree: FamilyTreeResponse;
};

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

export type FundType =
  | "FAMILY_GENERAL"
  | "EVENT_FUND"
  | "EMERGENCY_HELP"
  | "ZAKAT"
  | "SADAQAH"
  | "EDUCATION"
  | "MEDICAL"
  | "OTHER";
export type FundStatus = "DRAFT" | "ACTIVE" | "CLOSED" | "CANCELLED" | "ARCHIVED";
export type FundVisibility = "ALL_FAMILY" | "INVITED_ONLY" | "ADMIN_ONLY";
export type ContributionRequestStatus = "PENDING" | "PARTIALLY_PAID" | "PAID" | "WAIVED" | "CANCELLED";
export type FundTransactionType =
  | "CONTRIBUTION"
  | "ZAKAT_INCOME"
  | "SADAQAH_INCOME"
  | "EXPENSE"
  | "DISBURSEMENT"
  | "REFUND"
  | "ADJUSTMENT";
export type FundTransactionStatus = "PENDING" | "CONFIRMED" | "REJECTED" | "CANCELLED";
export type FundPaymentMethod = "CASH" | "BANK_TRANSFER" | "EASYPAISA" | "JAZZCASH" | "OTHER";
export type FundLedgerDirection = "CREDIT" | "DEBIT";

export type MobileFund = {
  id: string;
  title: string;
  description: string | null;
  type: FundType;
  status: FundStatus;
  visibility: FundVisibility;
  targetAmount: string | null;
  balanceAmount: string;
  collectedAmount: string;
  spentAmount: string;
  currency: string;
  isOfficial: boolean;
  isPinned: boolean;
  startAt: string | null;
  endAt: string | null;
  createdByMemberId: string;
  createdByDisplayName: string;
  myRequestStatus?: ContributionRequestStatus | null;
  myRequestedAmount?: string | null;
  myPaidAmount?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type MobileFundTransaction = {
  id: string;
  fundId: string;
  type: FundTransactionType;
  direction: FundLedgerDirection;
  status: FundTransactionStatus;
  amount: string;
  currency: string;
  contributorMemberId: string | null;
  contributorDisplayName: string | null;
  recipientMemberId: string | null;
  recipientDisplayName: string | null;
  paymentMethod: FundPaymentMethod | null;
  referenceNumber: string | null;
  note: string | null;
  confirmedAt: string | null;
  createdAt: string;
};

export type MobileContributionRequest = {
  id: string;
  fundId: string;
  fundTitle: string;
  memberId: string;
  memberDisplayName: string;
  requestedAmount: string | null;
  paidAmount: string;
  remainingAmount: string | null;
  currency: string;
  status: ContributionRequestStatus;
  note: string | null;
  createdAt: string;
  updatedAt: string;
};

export type DirectoryTagDto = {
  id: string;
  name: string;
  slug: string;
  type: string;
  color?: string | null;
};

export type MobileDirectoryMemberDto = {
  id: string;
  displayName: string;
  name: string | null;
  alias: string | null;
  initials: string;
  gender: "male" | "female";
  city: string | null;
  profession: string | null;
  branchLabel: string | null;
  phone: string | null;
  bio: string | null;
  availabilityNote: string | null;
  tags: DirectoryTagDto[];
  isPrivate: boolean;
  isPresident?: boolean;
  isAdmin?: boolean;
};

export type DirectorySettingDto = {
  id: string;
  memberId: string;
  visibility: "VISIBLE" | "LIMITED" | "HIDDEN";
  showPhone: boolean;
  showCity: boolean;
  showProfession: boolean;
  allowHelpRequests: boolean;
  bio: string | null;
  availabilityNote: string | null;
  createdAt: string;
  updatedAt: string;
};

export type MobileHelpRequestDto = {
  id: string;
  title: string;
  message: string;
  category: string | null;
  priority: "low" | "normal" | "high" | "urgent";
  status: "pending" | "accepted" | "declined" | "completed" | "cancelled";
  fromMember: { id: string; displayName: string; initials: string };
  toMember: { id: string; displayName: string; initials: string };
  responseMessage: string | null;
  createdAt: string;
  respondedAt: string | null;
  completedAt: string | null;
};

export type MobileElectionPhaseDto = {
  type: string;
  title: string;
  description: string | null;
  startsAt: string | null;
  endsAt: string | null;
  isActive: boolean;
  isCompleted: boolean;
  extensionCount: number;
};

export type MobileElectionCandidateDto = {
  id: string;
  memberId: string;
  displayName: string;
  initials: string;
  city: string | null;
  profession: string | null;
  statement: string;
  manifesto: string | null;
  goals: string | null;
  slogan: string | null;
  status: string;
  voteCount?: number;
  percentage?: number;
  isWinner?: boolean;
};

export type MobileElectionResultDto = {
  totalEligibleVoters: number;
  totalVotesCast: number;
  invalidBallots: number;
  turnoutPercentage: number;
  resultHash: string | null;
  candidates: MobileElectionCandidateDto[];
  publishedAt: string | null;
};

export type MobileElectionDto = {
  id: string;
  title: string;
  description: string | null;
  positionTitle: string;
  status: string;
  currentPhase: string;
  timeline: MobileElectionPhaseDto[];
  nominationStatus: string | null;
  voteStatus: "not_open" | "eligible" | "already_voted" | "closed" | "not_eligible";
  hasVoted: boolean;
  voteReceiptHash?: string | null;
  voteReceiptCode?: string | null;
  candidates: MobileElectionCandidateDto[];
  result: MobileElectionResultDto | null;
  ceremony: {
    ceremonyAt: string | null;
    winnerDisplayName: string | null;
    isCompleted: boolean;
  } | null;
};

export type MobileNotificationDto = {
  id: string;
  memberId: string;
  type: string;
  priority: "LOW" | "NORMAL" | "HIGH" | "URGENT";
  status: "UNREAD" | "READ" | "ARCHIVED";
  title: string;
  body: string | null;
  entityType: string | null;
  entityId: string | null;
  actionLabel: string | null;
  actionUrl: string | null;
  metadata: unknown;
  readAt: string | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type MobileAnnouncementDto = {
  id: string;
  title: string;
  body: string;
  publishedAt: string;
  priority?: "LOW" | "NORMAL" | "HIGH" | "URGENT";
};

export type DevicePushTokenDto = {
  id: string;
  memberId: string;
  token: string;
  provider: "EXPO" | "FCM" | "APNS";
  platform: "IOS" | "ANDROID" | "WEB" | "UNKNOWN";
  deviceId: string | null;
  deviceName: string | null;
  isActive: boolean;
  lastSeenAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type NotificationPreferenceDto = {
  id: string;
  memberId: string;
  pushEnabled: boolean;
  announcementsPush: boolean;
  eventInvitesPush: boolean;
  fundsPush: boolean;
  helpRequestsPush: boolean;
  electionsPush: boolean;
  systemPush: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string | null;
  quietHoursEnd: string | null;
  createdAt: string;
  updatedAt: string;
};
