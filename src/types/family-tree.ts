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
