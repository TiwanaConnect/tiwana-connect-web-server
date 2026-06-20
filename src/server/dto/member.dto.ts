import type { Member, UserAccount } from "@prisma/client";

import { toMobileSafeMember } from "@/lib/privacy/member-display";

type MemberWithUser = Member & {
  userAccount?: UserAccount | null;
};

export function toAdminUserAccountDto(userAccount: UserAccount | null | undefined) {
  if (!userAccount) {
    return null;
  }

  return {
    id: userAccount.id,
    memberId: userAccount.memberId,
    username: userAccount.username,
    role: userAccount.role,
    mustChangePassword: userAccount.mustChangePassword,
    lastLoginAt: userAccount.lastLoginAt,
    isActive: userAccount.isActive,
    createdAt: userAccount.createdAt,
    updatedAt: userAccount.updatedAt
  };
}

export function toAdminMemberDto(member: MemberWithUser) {
  return {
    id: member.id,
    fullName: member.fullName,
    alias: member.alias,
    displayName: member.fullName ?? member.alias ?? "Unnamed Member",
    initials: member.initials,
    gender: member.gender,
    visibility: member.visibility,
    status: member.status,
    isFamilyHead: member.isFamilyHead,
    city: member.city,
    profession: member.profession,
    phone: member.phone,
    branchLabel: member.branchLabel,
    dateOfBirth: member.dateOfBirth,
    notes: member.notes,
    createdAt: member.createdAt,
    updatedAt: member.updatedAt,
    deletedAt: member.deletedAt,
    userAccount: toAdminUserAccountDto(member.userAccount)
  };
}

export function toMobileMemberDto(
  member: MemberWithUser,
  viewer?: { role: MemberWithUser["userAccount"] extends UserAccount ? UserAccount["role"] : never }
) {
  return toMobileSafeMember(member, viewer);
}
