export type MemberGender = "MALE" | "FEMALE";
export type VisibilityStatus = "VISIBLE" | "HIDDEN";
export type MemberStatus = "ACTIVE" | "BLOCKED" | "PENDING";

export type MemberProfile = {
  id: string;
  displayName: string;
  initials: string;
  gender: MemberGender;
  visibility: VisibilityStatus;
  status: MemberStatus;
  isFamilyHead?: boolean;
};
