import type {
  Member,
  MemberDirectorySetting,
  MemberHelpRequest,
  MemberTag,
  MemberTagAssignment,
  UserAccount,
  UserRole
} from "@prisma/client";

import { getMemberDisplayNameForViewer, isPrivateMember } from "@/lib/privacy/member-display";
import type { AdminDirectoryMemberDto, MobileDirectoryMemberDto, MobileHelpRequestDto } from "@/types/directory";

export type DirectoryMemberWithRelations = Member & {
  userAccount?: UserAccount | null;
  directorySetting?: MemberDirectorySetting | null;
  tagAssignments: Array<MemberTagAssignment & { tag: MemberTag }>;
};

export type HelpRequestWithMembers = MemberHelpRequest & {
  fromMember: Member;
  toMember: Member;
};

function defaultSetting(member: DirectoryMemberWithRelations) {
  return {
    visibility: member.directorySetting?.visibility ?? "VISIBLE",
    showPhone: member.directorySetting?.showPhone ?? false,
    showCity: member.directorySetting?.showCity ?? true,
    showProfession: member.directorySetting?.showProfession ?? true,
    allowHelpRequests: member.directorySetting?.allowHelpRequests ?? true,
    bio: member.directorySetting?.bio ?? null,
    availabilityNote: member.directorySetting?.availabilityNote ?? null
  };
}

function tags(member: DirectoryMemberWithRelations) {
  return member.tagAssignments
    .filter((assignment) => assignment.tag.isActive)
    .map((assignment) => ({
      id: assignment.tag.id,
      name: assignment.tag.name,
      slug: assignment.tag.slug,
      type: assignment.tag.type,
      color: assignment.tag.color
    }));
}

export function toAdminDirectoryMemberDto(member: DirectoryMemberWithRelations): AdminDirectoryMemberDto {
  const setting = defaultSetting(member);
  return {
    id: member.id,
    fullName: member.fullName,
    alias: member.alias,
    displayName: member.fullName ?? member.alias ?? "Unnamed Member",
    initials: member.initials,
    gender: member.gender,
    visibility: member.visibility,
    status: member.status,
    city: member.city,
    profession: member.profession,
    phone: member.phone,
    branchLabel: member.branchLabel,
    directoryVisibility: setting.visibility,
    showPhone: setting.showPhone,
    showCity: setting.showCity,
    showProfession: setting.showProfession,
    allowHelpRequests: setting.allowHelpRequests,
    bio: setting.bio,
    availabilityNote: setting.availabilityNote,
    tags: tags(member)
  };
}

export function toMobileDirectoryMemberDto(
  member: DirectoryMemberWithRelations,
  viewerRole: UserRole,
  viewerMemberId: string
): MobileDirectoryMemberDto {
  const setting = defaultSetting(member);
  const privateMember = isPrivateMember(member);
  const self = member.id === viewerMemberId;
  const limited = setting.visibility === "LIMITED" && !self;

  return {
    id: member.id,
    displayName: getMemberDisplayNameForViewer(member, viewerRole),
    name: privateMember && viewerRole === "MEMBER" ? null : member.fullName,
    alias: member.alias,
    initials: member.initials,
    gender: member.gender.toLowerCase() as "male" | "female",
    city: !limited && setting.showCity ? member.city : null,
    profession: !limited && setting.showProfession ? member.profession : null,
    branchLabel: limited ? null : member.branchLabel,
    phone: !limited && setting.showPhone ? member.phone : null,
    bio: limited ? null : setting.bio,
    availabilityNote: limited ? null : setting.availabilityNote,
    tags: tags(member),
    isPrivate: privateMember,
    isPresident: member.userAccount?.role === "PRESIDENT" || undefined,
    isAdmin: member.userAccount?.role === "SUPER_ADMIN" || undefined
  };
}

function helpRequestMember(member: Member, viewerRole: UserRole) {
  return {
    id: member.id,
    displayName: getMemberDisplayNameForViewer(member, viewerRole),
    initials: member.initials
  };
}

export function toMobileHelpRequestDto(request: HelpRequestWithMembers, viewerRole: UserRole): MobileHelpRequestDto {
  return {
    id: request.id,
    title: request.title,
    message: request.message,
    category: request.category,
    priority: request.priority.toLowerCase() as MobileHelpRequestDto["priority"],
    status: request.status.toLowerCase() as MobileHelpRequestDto["status"],
    fromMember: helpRequestMember(request.fromMember, viewerRole),
    toMember: helpRequestMember(request.toMember, viewerRole),
    responseMessage: request.responseMessage,
    createdAt: request.createdAt.toISOString(),
    respondedAt: request.respondedAt?.toISOString() ?? null,
    completedAt: request.completedAt?.toISOString() ?? null
  };
}

export function toAdminHelpRequestDto(request: HelpRequestWithMembers) {
  return {
    id: request.id,
    title: request.title,
    message: request.message,
    category: request.category,
    priority: request.priority,
    status: request.status,
    fromMember: {
      id: request.fromMemberId,
      displayName: request.fromMember.fullName ?? request.fromMember.alias ?? "Unnamed Member",
      initials: request.fromMember.initials
    },
    toMember: {
      id: request.toMemberId,
      displayName: request.toMember.fullName ?? request.toMember.alias ?? "Unnamed Member",
      initials: request.toMember.initials
    },
    responseMessage: request.responseMessage,
    createdAt: request.createdAt.toISOString(),
    respondedAt: request.respondedAt?.toISOString() ?? null,
    completedAt: request.completedAt?.toISOString() ?? null,
    cancelledAt: request.cancelledAt?.toISOString() ?? null
  };
}
