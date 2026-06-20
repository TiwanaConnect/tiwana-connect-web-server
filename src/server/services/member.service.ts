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
  page?: number;
  limit?: number;
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

export async function generateUniqueMemberId(tx: Prisma.TransactionClient = prisma) {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const id = String(Math.floor(100000 + Math.random() * 900000));
    const existing = await tx.member.findUnique({ where: { id }, select: { id: true } });
    if (!existing) return id;
  }

  throw new AppError(API_ERROR_CODES.CONFLICT, "Could not generate a unique member ID. Please try again.", 409);
}

export async function listMembers(filters: MemberListFilters) {
  const where: Prisma.MemberWhereInput = {
    deletedAt: null
  };

  if (filters.search) {
    where.OR = [
      { id: { contains: filters.search, mode: "insensitive" } },
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

  const page = filters.page ?? 1;
  const limit = filters.limit ?? 20;
  const [members, totalMembers] = await Promise.all([
    prisma.member.findMany({
      where,
      include: { userAccount: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit
    }),
    prisma.member.count({ where })
  ]);

  return {
    members: members.map(toAdminMemberDto),
    totalMembers,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(totalMembers / limit))
  };
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
    spouseMemberIds?: string[];
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

  const spouseMemberIds = [
    ...(input.relationships?.spouseMemberIds ?? []),
    input.relationships?.spouseMemberId
  ].filter(Boolean) as string[];
  const uniqueSpouseMemberIds = [...new Set(spouseMemberIds)];
  const relationshipIds = [
    input.relationships?.fatherMemberId,
    input.relationships?.motherMemberId,
    ...uniqueSpouseMemberIds
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

  if (input.gender === "FEMALE" && uniqueSpouseMemberIds.length > 1) {
    throw new AppError(API_ERROR_CODES.VALIDATION_ERROR, "A female member can only have one husband.", 400);
  }

  for (const spouseMemberId of uniqueSpouseMemberIds) {
    const spouse = relatedMemberById.get(spouseMemberId);
    if (spouse && spouse.gender === input.gender) {
      throw new AppError(
        API_ERROR_CODES.VALIDATION_ERROR,
        "Spouse must be the opposite gender of the member.",
        400
      );
    }
  }

  const transactionResult = await prisma.$transaction(async (tx) => {
    const memberId = await generateUniqueMemberId(tx);
    const created = await tx.member.create({
      data: {
        id: memberId,
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

    for (const spouseMemberId of uniqueSpouseMemberIds) {
      relationshipRows.push(
        {
          fromMemberId: created.id,
          toMemberId: spouseMemberId,
          type: FamilyRelationshipType.SPOUSE
        },
        {
          fromMemberId: spouseMemberId,
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
  relationships?: {
    fatherMemberId?: string | null;
    motherMemberId?: string | null;
    spouseMemberId?: string | null;
    spouseMemberIds?: string[];
  };
  actorMemberId?: string;
}) {
  const existing = await prisma.member.findUnique({ where: { id } });

  if (!existing || existing.deletedAt) {
    throw new AppError(API_ERROR_CODES.NOT_FOUND, "Member not found.", 404);
  }

  const nextGender = input.gender ?? existing.gender;
  const spouseMemberIds = [
    ...(input.relationships?.spouseMemberIds ?? []),
    input.relationships?.spouseMemberId
  ].filter(Boolean) as string[];
  const uniqueSpouseMemberIds = [...new Set(spouseMemberIds)].filter((memberId) => memberId !== id);
  const directRelationshipIds = [
    input.relationships?.fatherMemberId,
    input.relationships?.motherMemberId,
    ...uniqueSpouseMemberIds
  ].filter(Boolean) as string[];

  if (input.relationships) {
    if (input.relationships.fatherMemberId === id || input.relationships.motherMemberId === id) {
      throw new AppError(API_ERROR_CODES.VALIDATION_ERROR, "A member cannot be their own parent.", 400);
    }
    if (
      input.relationships.fatherMemberId &&
      input.relationships.motherMemberId &&
      input.relationships.fatherMemberId === input.relationships.motherMemberId
    ) {
      throw new AppError(API_ERROR_CODES.VALIDATION_ERROR, "Father and mother cannot be the same member.", 400);
    }
    if (nextGender === "FEMALE" && uniqueSpouseMemberIds.length > 1) {
      throw new AppError(API_ERROR_CODES.VALIDATION_ERROR, "A female member can only have one husband.", 400);
    }

    const relatedMembers = directRelationshipIds.length
      ? await prisma.member.findMany({
          where: { id: { in: directRelationshipIds }, deletedAt: null },
          select: { id: true, gender: true }
        })
      : [];
    const relatedMemberById = new Map(relatedMembers.map((member) => [member.id, member]));

    for (const relationshipId of directRelationshipIds) {
      if (!relatedMemberById.has(relationshipId)) {
        throw new AppError(API_ERROR_CODES.VALIDATION_ERROR, "Selected relationship member does not exist.", 400);
      }
    }

    const father = input.relationships.fatherMemberId ? relatedMemberById.get(input.relationships.fatherMemberId) : null;
    const mother = input.relationships.motherMemberId ? relatedMemberById.get(input.relationships.motherMemberId) : null;
    if (father && father.gender !== "MALE") {
      throw new AppError(API_ERROR_CODES.VALIDATION_ERROR, "Father must be a male member.", 400);
    }
    if (mother && mother.gender !== "FEMALE") {
      throw new AppError(API_ERROR_CODES.VALIDATION_ERROR, "Mother must be a female member.", 400);
    }

    for (const spouseMemberId of uniqueSpouseMemberIds) {
      const spouse = relatedMemberById.get(spouseMemberId);
      if (spouse && spouse.gender === nextGender) {
        throw new AppError(API_ERROR_CODES.VALIDATION_ERROR, "Spouse must be the opposite gender of the member.", 400);
      }
    }
  }

  const member = await prisma.$transaction(async (tx) => {
    const updated = await tx.member.update({
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

    if (input.relationships) {
      const existingDirectRelationships = await tx.familyRelationship.findMany({
        where: {
          OR: [
            { toMemberId: id, type: { in: ["FATHER", "MOTHER"] } },
            { fromMemberId: id, type: "CHILD" },
            { fromMemberId: id, type: "SPOUSE" },
            { toMemberId: id, type: "SPOUSE" }
          ]
        },
        select: { id: true }
      });

      if (existingDirectRelationships.length > 0) {
        await tx.familyRelationship.deleteMany({
          where: { id: { in: existingDirectRelationships.map((relationship) => relationship.id) } }
        });
      }

      const relationshipRows: Array<{
        fromMemberId: string;
        toMemberId: string;
        type: FamilyRelationshipType;
      }> = [];

      if (input.relationships.fatherMemberId) {
        relationshipRows.push(
          { fromMemberId: input.relationships.fatherMemberId, toMemberId: id, type: FamilyRelationshipType.FATHER },
          { fromMemberId: id, toMemberId: input.relationships.fatherMemberId, type: FamilyRelationshipType.CHILD }
        );
      }

      if (input.relationships.motherMemberId) {
        relationshipRows.push(
          { fromMemberId: input.relationships.motherMemberId, toMemberId: id, type: FamilyRelationshipType.MOTHER },
          { fromMemberId: id, toMemberId: input.relationships.motherMemberId, type: FamilyRelationshipType.CHILD }
        );
      }

      for (const spouseMemberId of uniqueSpouseMemberIds) {
        relationshipRows.push(
          { fromMemberId: id, toMemberId: spouseMemberId, type: FamilyRelationshipType.SPOUSE },
          { fromMemberId: spouseMemberId, toMemberId: id, type: FamilyRelationshipType.SPOUSE }
        );
      }

      if (relationshipRows.length > 0) {
        await tx.familyRelationship.createMany({ data: relationshipRows, skipDuplicates: true });
      }
    }

    return updated;
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
