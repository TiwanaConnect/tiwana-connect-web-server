import {
  FamilyRelationshipType,
  MemberGender,
  Prisma,
  UserRole,
  VisibilityStatus
} from "@prisma/client";

import { API_ERROR_CODES, AppError } from "@/lib/api/errors";
import { prisma } from "@/lib/db/prisma";
import { hashPassword, generateTemporaryPassword } from "@/lib/auth/password";
import { toAdminMemberDto } from "@/server/dto/member.dto";

import { recordAuditLog } from "./audit.service";

export type MemberListFilters = {
  search?: string;
  status?: string;
  gender?: string;
  visibility?: string;
  role?: string;
  hasLogin?: "true" | "false";
  isFamilyHead?: "true" | "false";
};

function initialsFromName(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 3)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function getDefaultVisibility(gender: MemberGender, visibility?: VisibilityStatus) {
  if (visibility) {
    return visibility;
  }

  return gender === "FEMALE" ? VisibilityStatus.HIDDEN : VisibilityStatus.VISIBLE;
}

export function normalizeDate(value?: string) {
  if (!value) {
    return undefined;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

export async function listMembers(filters: MemberListFilters) {
  const where: Prisma.MemberWhereInput = {
    deletedAt: null
  };

  if (filters.search) {
    where.OR = [
      { fullName: { contains: filters.search, mode: "insensitive" } },
      { alias: { contains: filters.search, mode: "insensitive" } },
      { phone: { contains: filters.search, mode: "insensitive" } },
      { city: { contains: filters.search, mode: "insensitive" } }
    ];
  }

  if (filters.status) where.status = filters.status as never;
  if (filters.gender) where.gender = filters.gender as never;
  if (filters.visibility) where.visibility = filters.visibility as never;
  if (filters.hasLogin === "true") where.userAccount = { isNot: null };
  if (filters.hasLogin === "false") where.userAccount = { is: null };
  if (filters.role) where.userAccount = { is: { role: filters.role as never } };
  if (filters.isFamilyHead === "true") where.isFamilyHead = true;
  if (filters.isFamilyHead === "false") where.isFamilyHead = false;

  const members = await prisma.member.findMany({
    where,
    include: { userAccount: true },
    orderBy: { createdAt: "desc" }
  });

  return members.map(toAdminMemberDto);
}

export async function getMember(id: string) {
  const member = await prisma.member.findUnique({
    where: { id },
    include: { userAccount: true }
  });

  if (!member || member.deletedAt) {
    throw new AppError(API_ERROR_CODES.NOT_FOUND, "Member not found.", 404);
  }

  return toAdminMemberDto(member);
}

export async function createMember(input: {
  fullName?: string;
  alias?: string;
  gender: MemberGender;
  visibility?: VisibilityStatus;
  isFamilyHead?: boolean;
  city?: string;
  phone?: string;
  profession?: string;
  branchLabel?: string;
  dateOfBirth?: string;
  notes?: string;
  createLogin?: boolean;
  username?: string;
  role?: UserRole;
  relationships?: {
    fatherMemberId?: string | null;
    motherMemberId?: string | null;
    spouseMemberId?: string | null;
  };
  actorMemberId?: string;
}) {
  const nameForInitials = input.fullName ?? input.alias ?? "Member";
  const temporaryPassword = input.createLogin
    ? generateTemporaryPassword()
    : undefined;

  if (input.createLogin && input.username) {
    const existingUsername = await prisma.userAccount.findUnique({
      where: { username: input.username }
    });

    if (existingUsername) {
      throw new AppError(API_ERROR_CODES.CONFLICT, "Username already exists.", 409);
    }
  }

  const relationshipIds = [
    input.relationships?.fatherMemberId,
    input.relationships?.motherMemberId,
    input.relationships?.spouseMemberId
  ].filter(Boolean) as string[];

  const relatedMembers = relationshipIds.length
    ? await prisma.member.findMany({
        where: {
          id: { in: relationshipIds },
          deletedAt: null
        }
      })
    : [];
  const relatedMemberById = new Map(
    relatedMembers.map((member) => [member.id, member])
  );

  for (const relationshipId of relationshipIds) {
    if (!relatedMemberById.has(relationshipId)) {
      throw new AppError(
        API_ERROR_CODES.VALIDATION_ERROR,
        "Selected relationship member does not exist.",
        400
      );
    }
  }

  const spouse = input.relationships?.spouseMemberId
    ? relatedMemberById.get(input.relationships.spouseMemberId)
    : null;

  if (spouse && spouse.gender === input.gender) {
    throw new AppError(
      API_ERROR_CODES.VALIDATION_ERROR,
      "Spouse must be the opposite gender of the new member.",
      400
    );
  }

  const transactionResult = await prisma.$transaction(async (tx) => {
    const created = await tx.member.create({
      data: {
        fullName: input.fullName,
        alias: input.alias,
        initials: initialsFromName(nameForInitials),
        gender: input.gender,
        visibility: getDefaultVisibility(input.gender, input.visibility),
        isFamilyHead: input.isFamilyHead ?? false,
        city: input.city,
        phone: input.phone,
        profession: input.profession,
        branchLabel: input.branchLabel,
        dateOfBirth: normalizeDate(input.dateOfBirth),
        notes: input.notes,
        ...(input.createLogin && input.username && temporaryPassword
          ? {
              userAccount: {
                create: {
                  username: input.username,
                  passwordHash: await hashPassword(temporaryPassword),
                  role: input.role ?? UserRole.MEMBER,
                  mustChangePassword: true
                }
              }
            }
          : {})
      },
      include: { userAccount: true }
    });

    const relationshipRows: Array<{
      fromMemberId: string;
      toMemberId: string;
      type: FamilyRelationshipType;
    }> = [];
    const relationshipsCreated = {
      father: false,
      mother: false,
      spouse: false
    };

    if (input.relationships?.fatherMemberId) {
      relationshipRows.push(
        {
          fromMemberId: input.relationships.fatherMemberId,
          toMemberId: created.id,
          type: FamilyRelationshipType.FATHER
        },
        {
          fromMemberId: created.id,
          toMemberId: input.relationships.fatherMemberId,
          type: FamilyRelationshipType.CHILD
        }
      );
      relationshipsCreated.father = true;
    }

    if (input.relationships?.motherMemberId) {
      relationshipRows.push(
        {
          fromMemberId: input.relationships.motherMemberId,
          toMemberId: created.id,
          type: FamilyRelationshipType.MOTHER
        },
        {
          fromMemberId: created.id,
          toMemberId: input.relationships.motherMemberId,
          type: FamilyRelationshipType.CHILD
        }
      );
      relationshipsCreated.mother = true;
    }

    if (input.relationships?.spouseMemberId) {
      relationshipRows.push(
        {
          fromMemberId: created.id,
          toMemberId: input.relationships.spouseMemberId,
          type: FamilyRelationshipType.SPOUSE
        },
        {
          fromMemberId: input.relationships.spouseMemberId,
          toMemberId: created.id,
          type: FamilyRelationshipType.SPOUSE
        }
      );
      relationshipsCreated.spouse = true;
    }

    if (relationshipRows.length > 0) {
      await tx.familyRelationship.createMany({
        data: relationshipRows,
        skipDuplicates: true
      });
    }

    await tx.auditLog.create({
      data: {
        actorMemberId: input.actorMemberId,
        action: "MEMBER_CREATED",
        entityType: "MEMBER",
        entityId: created.id
      }
    });

    if (created.userAccount) {
      await tx.auditLog.create({
        data: {
          actorMemberId: input.actorMemberId,
          action: "USER_ACCOUNT_GENERATED",
          entityType: "USER_ACCOUNT",
          entityId: created.userAccount.id
        }
      });
    }

    if (relationshipRows.length > 0) {
      await tx.auditLog.create({
        data: {
          actorMemberId: input.actorMemberId,
          action: "INITIAL_RELATIONSHIPS_CREATED",
          entityType: "FAMILY_RELATIONSHIP",
          entityId: created.id,
          metadata: relationshipsCreated
        }
      });
    }

    return { member: created, relationshipsCreated };
  });
  const member = transactionResult.member;

  const generatedCredential =
    member.userAccount && temporaryPassword
      ? {
          memberName: member.fullName ?? member.alias ?? member.initials,
          username: member.userAccount.username,
          temporaryPassword
        }
      : null;

  return {
    member: toAdminMemberDto(member),
    generatedCredential,
    generatedCredentials: generatedCredential
      ? {
          username: generatedCredential.username,
          temporaryPassword: generatedCredential.temporaryPassword
        }
      : undefined,
    relationshipsCreated: transactionResult.relationshipsCreated
  };
}

export async function updateMember(id: string, input: {
  fullName?: string;
  alias?: string;
  gender?: MemberGender;
  visibility?: VisibilityStatus;
  isFamilyHead?: boolean;
  status?: string;
  city?: string;
  phone?: string;
  profession?: string;
  branchLabel?: string;
  dateOfBirth?: string;
  notes?: string;
  actorMemberId?: string;
}) {
  const existing = await prisma.member.findUnique({ where: { id } });

  if (!existing || existing.deletedAt) {
    throw new AppError(API_ERROR_CODES.NOT_FOUND, "Member not found.", 404);
  }

  const member = await prisma.member.update({
    where: { id },
    data: {
      fullName: input.fullName,
      alias: input.alias,
      gender: input.gender,
      visibility: input.visibility,
      isFamilyHead: input.isFamilyHead,
      status: input.status as never,
      city: input.city,
      phone: input.phone,
      profession: input.profession,
      branchLabel: input.branchLabel,
      dateOfBirth: normalizeDate(input.dateOfBirth),
      notes: input.notes,
      initials:
        input.fullName || input.alias
          ? initialsFromName(input.fullName ?? input.alias ?? existing.initials)
          : undefined
    },
    include: { userAccount: true }
  });

  await recordAuditLog({
    actorMemberId: input.actorMemberId,
    action: "MEMBER_UPDATED",
    entityType: "MEMBER",
    entityId: id
  });

  return toAdminMemberDto(member);
}

export async function softDeleteMember(id: string, actorMemberId?: string) {
  const member = await prisma.member.update({
    where: { id },
    data: { deletedAt: new Date() },
    include: { userAccount: true }
  });

  await recordAuditLog({
    actorMemberId,
    action: "MEMBER_DELETED",
    entityType: "MEMBER",
    entityId: id
  });

  return toAdminMemberDto(member);
}

export async function setMemberStatus(
  id: string,
  status: "ACTIVE" | "BLOCKED",
  actorMemberId?: string
) {
  const member = await prisma.member.update({
    where: { id },
    data: { status },
    include: { userAccount: true }
  });

  await recordAuditLog({
    actorMemberId,
    action: status === "BLOCKED" ? "MEMBER_BLOCKED" : "MEMBER_UNBLOCKED",
    entityType: "MEMBER",
    entityId: id
  });

  return toAdminMemberDto(member);
}
