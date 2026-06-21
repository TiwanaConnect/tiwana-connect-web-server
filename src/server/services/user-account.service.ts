import { UserRole } from "@prisma/client";

import { API_ERROR_CODES, AppError } from "@/lib/api/errors";
import { generateTemporaryPassword, hashPassword } from "@/lib/auth/password";
import { prisma } from "@/lib/db/prisma";

import { recordAuditLog } from "./audit.service";

async function addMemberToOpenElectionVoterLists(memberId: string) {
  const elections = await prisma.election.findMany({
    where: {
      deletedAt: null,
      status: { notIn: ["COMPLETED", "CANCELLED"] }
    },
    select: { id: true }
  });

  if (elections.length === 0) return 0;

  const result = await prisma.electionVoter.createMany({
    data: elections.map((election) => ({
      electionId: election.id,
      memberId
    })),
    skipDuplicates: true
  });

  return result.count;
}

export async function generateLoginAccess(input: {
  memberId: string;
  username: string;
  role: UserRole;
  temporaryPassword?: string;
  actorMemberId?: string;
}) {
  const member = await prisma.member.findUnique({
    where: { id: input.memberId }
  });

  if (!member || member.deletedAt) {
    throw new AppError(API_ERROR_CODES.NOT_FOUND, "Member not found.", 404);
  }

  const existing = await prisma.userAccount.findUnique({
    where: { memberId: input.memberId }
  });

  if (existing) {
    throw new AppError(API_ERROR_CODES.CONFLICT, "Member already has login access.", 409);
  }

  const existingUsername = await prisma.userAccount.findUnique({
    where: { username: input.username }
  });

  if (existingUsername) {
    throw new AppError(API_ERROR_CODES.CONFLICT, "Username already exists.", 409);
  }

  const temporaryPassword = input.temporaryPassword ?? generateTemporaryPassword();

  const account = await prisma.userAccount.create({
    data: {
      memberId: input.memberId,
      username: input.username,
      passwordHash: await hashPassword(temporaryPassword),
      role: input.role,
      mustChangePassword: true,
      isActive: true
    },
    include: { member: true }
  });

  await recordAuditLog({
    actorMemberId: input.actorMemberId,
    action: "USER_ACCOUNT_GENERATED",
    entityType: "USER_ACCOUNT",
    entityId: account.id
  });
  const eligibleElectionsAdded = await addMemberToOpenElectionVoterLists(input.memberId);

  return {
    memberId: input.memberId,
    username: account.username,
    temporaryPassword,
    eligibleElectionsAdded
  };
}

export async function resetMemberPassword(memberId: string, actorMemberId?: string) {
  const account = await prisma.userAccount.findUnique({ where: { memberId } });

  if (!account) {
    throw new AppError(API_ERROR_CODES.NOT_FOUND, "User account not found.", 404);
  }

  const temporaryPassword = generateTemporaryPassword();

  await prisma.userAccount.update({
    where: { id: account.id },
    data: {
      passwordHash: await hashPassword(temporaryPassword),
      mustChangePassword: true
    }
  });

  await recordAuditLog({
    actorMemberId,
    action: "PASSWORD_RESET",
    entityType: "USER_ACCOUNT",
    entityId: account.id
  });

  return {
    memberId,
    username: account.username,
    temporaryPassword
  };
}

export async function setLoginActive(
  memberId: string,
  isActive: boolean,
  actorMemberId?: string
) {
  const account = await prisma.userAccount.findUnique({ where: { memberId } });

  if (!account) {
    throw new AppError(API_ERROR_CODES.NOT_FOUND, "User account not found.", 404);
  }

  const updated = await prisma.userAccount.update({
    where: { id: account.id },
    data: { isActive }
  });

  await recordAuditLog({
    actorMemberId,
    action: isActive ? "LOGIN_ENABLED" : "LOGIN_DISABLED",
    entityType: "USER_ACCOUNT",
    entityId: account.id
  });

  return {
    memberId,
    username: updated.username,
    isActive: updated.isActive
  };
}
