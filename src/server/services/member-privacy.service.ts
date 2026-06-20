import type { UserRole } from "@prisma/client";
import { isPrivateMember } from "@/lib/privacy/member-display";
import type { MemberNode } from "@/types/family-tree";
import type { GraphMember } from "@/server/graph/family-graph";

function genderToNodeValue(gender: GraphMember["gender"]): MemberNode["gender"] {
  return gender === "FEMALE" ? "female" : "male";
}

function visibilityToNodeValue(
  visibility: GraphMember["visibility"]
): MemberNode["visibility"] {
  return visibility === "HIDDEN" ? "hidden" : "visible";
}

function statusToNodeValue(status: GraphMember["status"]): MemberNode["status"] {
  if (status === "BLOCKED") return "blocked";
  if (status === "PENDING") return "pending";
  return "active";
}

export function toMemberNode(input: {
  member: GraphMember;
  viewerRole: UserRole;
  relationshipLabel?: string;
  localRelationshipLabel?: string | null;
  currentUserId?: string;
  includeHiddenNames?: boolean;
}) {
  const isAdminViewer =
    input.viewerRole === "SUPER_ADMIN" || input.viewerRole === "PRESIDENT";
  const privateForViewer =
    isPrivateMember(input.member) && !(isAdminViewer && input.includeHiddenNames);
  const name = privateForViewer ? null : input.member.fullName;
  const displayName = privateForViewer
    ? input.member.alias ?? "Private family member"
    : input.member.fullName ?? input.member.alias ?? "Unknown Member";

  return {
    id: input.member.id,
    name,
    alias: input.member.alias,
    displayName,
    initials: input.member.initials,
    gender: genderToNodeValue(input.member.gender),
    visibility: visibilityToNodeValue(input.member.visibility),
    status: statusToNodeValue(input.member.status),
    relationshipLabel: input.relationshipLabel ?? "Relative",
    localRelationshipLabel: input.localRelationshipLabel ?? null,
    city: input.member.city,
    profession: input.member.profession,
    branchLabel: input.member.branchLabel,
    isCurrentUser: input.member.id === input.currentUserId,
    isFamilyHead: input.member.isFamilyHead,
    isPresident: input.member.userAccount?.role === "PRESIDENT",
    isAdmin: input.member.userAccount?.role === "SUPER_ADMIN",
    isPrivate: privateForViewer
  } satisfies MemberNode;
}
