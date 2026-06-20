import type { DirectoryVisibility, MemberGender, Prisma, UserRole, VisibilityStatus } from "@prisma/client";

import { API_ERROR_CODES, AppError } from "@/lib/api/errors";
import { prisma } from "@/lib/db/prisma";
import { toAdminDirectoryMemberDto, toMobileDirectoryMemberDto } from "@/server/dto/directory.dto";
import { findDirectoryMemberById, findDirectoryMembers } from "@/server/repositories/directory.repository";

import { recordAuditLog } from "./audit.service";

type DirectoryFilters = {
  q?: string;
  city?: string;
  profession?: string;
  gender?: MemberGender;
  branchLabel?: string;
  tagIds?: string[];
  tagSlugs?: string[];
  limit: number;
  cursor?: string;
};

function searchWhere(filters: DirectoryFilters): Prisma.MemberWhereInput {
  return {
    ...(filters.q
      ? {
          OR: [
            { fullName: { contains: filters.q, mode: "insensitive" } },
            { alias: { contains: filters.q, mode: "insensitive" } },
            { city: { contains: filters.q, mode: "insensitive" } },
            { profession: { contains: filters.q, mode: "insensitive" } },
            { branchLabel: { contains: filters.q, mode: "insensitive" } },
            { tagAssignments: { some: { tag: { name: { contains: filters.q, mode: "insensitive" } } } } }
          ]
        }
      : {}),
    ...(filters.city ? { city: { contains: filters.city, mode: "insensitive" } } : {}),
    ...(filters.profession ? { profession: { contains: filters.profession, mode: "insensitive" } } : {}),
    ...(filters.gender ? { gender: filters.gender } : {}),
    ...(filters.branchLabel ? { branchLabel: { contains: filters.branchLabel, mode: "insensitive" } } : {}),
    ...(filters.tagIds?.length ? { tagAssignments: { some: { tagId: { in: filters.tagIds } } } } : {}),
    ...(filters.tagSlugs?.length ? { tagAssignments: { some: { tag: { slug: { in: filters.tagSlugs } } } } } : {})
  };
}

export async function listMobileDirectory(input: DirectoryFilters & { viewerMemberId: string; viewerRole: UserRole }) {
  const members = await findDirectoryMembers({
    where: {
      deletedAt: null,
      status: "ACTIVE",
      ...searchWhere(input),
      OR: [
        { id: input.viewerMemberId },
        { directorySetting: null },
        { directorySetting: { visibility: { not: "HIDDEN" } } }
      ]
    },
    orderBy: [{ fullName: "asc" }, { alias: "asc" }, { createdAt: "asc" }],
    ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
    take: input.limit + 1
  });

  return {
    members: members.slice(0, input.limit).map((member) => toMobileDirectoryMemberDto(member, input.viewerRole, input.viewerMemberId)),
    nextCursor: members.length > input.limit ? members[input.limit]?.id ?? null : null
  };
}

export async function listAdminDirectory(filters: DirectoryFilters & {
  visibility?: VisibilityStatus;
  directoryVisibility?: DirectoryVisibility;
  hasPhone?: "true" | "false";
}) {
  const members = await findDirectoryMembers({
    where: {
      deletedAt: null,
      ...searchWhere(filters),
      ...(filters.visibility ? { visibility: filters.visibility } : {}),
      ...(filters.directoryVisibility ? { directorySetting: { visibility: filters.directoryVisibility } } : {}),
      ...(filters.hasPhone ? { phone: filters.hasPhone === "true" ? { not: null } : null } : {})
    },
    orderBy: [{ fullName: "asc" }, { alias: "asc" }],
    ...(filters.cursor ? { cursor: { id: filters.cursor }, skip: 1 } : {}),
    take: filters.limit + 1
  });

  return {
    members: members.slice(0, filters.limit).map(toAdminDirectoryMemberDto),
    nextCursor: members.length > filters.limit ? members[filters.limit]?.id ?? null : null
  };
}

export async function getDirectoryMember(input: { memberId: string; viewerMemberId: string; viewerRole: UserRole; admin?: boolean }) {
  const member = await findDirectoryMemberById(input.memberId);
  if (!member || member.deletedAt) throw new AppError(API_ERROR_CODES.NOT_FOUND, "Directory member not found.", 404);
  if (!input.admin && member.status !== "ACTIVE") throw new AppError(API_ERROR_CODES.NOT_FOUND, "Directory member not found.", 404);

  const visibility = member.directorySetting?.visibility ?? "VISIBLE";
  if (!input.admin && visibility === "HIDDEN" && member.id !== input.viewerMemberId) {
    throw new AppError(API_ERROR_CODES.FORBIDDEN, "This directory profile is hidden.", 403);
  }

  return input.admin
    ? { member: toAdminDirectoryMemberDto(member) }
    : { member: toMobileDirectoryMemberDto(member, input.viewerRole, input.viewerMemberId) };
}

export async function getMyDirectorySettings(memberId: string) {
  const setting = await prisma.memberDirectorySetting.upsert({
    where: { memberId },
    update: {},
    create: { memberId }
  });
  return { setting };
}

export async function updateDirectorySettings(input: {
  memberId: string;
  actorMemberId: string;
  admin?: boolean;
  visibility?: DirectoryVisibility;
  showPhone?: boolean;
  showCity?: boolean;
  showProfession?: boolean;
  allowHelpRequests?: boolean;
  bio?: string | null;
  availabilityNote?: string | null;
}) {
  const setting = await prisma.memberDirectorySetting.upsert({
    where: { memberId: input.memberId },
    update: {
      visibility: input.visibility,
      showPhone: input.showPhone,
      showCity: input.showCity,
      showProfession: input.showProfession,
      allowHelpRequests: input.allowHelpRequests,
      bio: input.bio,
      availabilityNote: input.availabilityNote
    },
    create: {
      memberId: input.memberId,
      visibility: input.visibility,
      showPhone: input.showPhone,
      showCity: input.showCity,
      showProfession: input.showProfession,
      allowHelpRequests: input.allowHelpRequests,
      bio: input.bio,
      availabilityNote: input.availabilityNote
    }
  });

  await recordAuditLog({
    actorMemberId: input.actorMemberId,
    action: input.admin ? "admin_directory_settings_updated" : "directory_settings_updated",
    entityType: "DIRECTORY",
    entityId: input.memberId
  });

  return { setting };
}
