import type { Member, UserRole } from "@prisma/client";

export type MobileMemberDto = {
  id: string;
  displayName: string;
  initials: string;
  gender: string;
  visibility: string;
  status: string;
  city: string | null;
  profession: string | null;
  branchLabel: string | null;
};

export function isPrivateMember(member: Pick<Member, "gender" | "visibility">) {
  return member.gender === "FEMALE" && member.visibility === "HIDDEN";
}

export function getMemberDisplayNameForViewer(
  member: Pick<Member, "fullName" | "alias" | "gender" | "visibility" | "initials">,
  viewerRole?: UserRole
) {
  if (viewerRole === "SUPER_ADMIN" || viewerRole === "PRESIDENT") {
    return member.fullName ?? member.alias ?? member.initials;
  }

  if (isPrivateMember(member)) {
    return member.alias ?? "Private family member";
  }

  return member.fullName ?? member.alias ?? member.initials;
}

export function toMobileSafeMember(
  member: Pick<
    Member,
    | "id"
    | "fullName"
    | "alias"
    | "initials"
    | "gender"
    | "visibility"
    | "status"
    | "city"
    | "profession"
    | "branchLabel"
  >,
  viewer?: { role: UserRole }
): MobileMemberDto {
  return {
    id: member.id,
    displayName: getMemberDisplayNameForViewer(member, viewer?.role),
    initials: member.initials,
    gender: member.gender,
    visibility: member.visibility,
    status: member.status,
    city: member.city,
    profession: member.profession,
    branchLabel: member.branchLabel
  };
}
