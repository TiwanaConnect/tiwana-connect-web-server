import type { NextRequest } from "next/server";

import { API_ERROR_CODES, AppError } from "@/lib/api/errors";
import { prisma } from "@/lib/db/prisma";
import { verifyPassword, hashPassword } from "@/lib/auth/password";
import {
  ACCESS_TOKEN_EXPIRES_IN_SECONDS,
  signAccessToken,
  signRefreshToken
} from "@/lib/auth/tokens";
import { toAdminMemberDto } from "@/server/dto/member.dto";

import { recordAuditLog } from "./audit.service";

export async function loginWithPassword(input: {
  username: string;
  password: string;
  request?: NextRequest;
}) {
  const account = await prisma.userAccount.findUnique({
    where: { username: input.username },
    include: { member: true }
  });

  if (!account) {
    throw new AppError(API_ERROR_CODES.UNAUTHORIZED, "Invalid credentials.", 401);
  }

  const isValidPassword = await verifyPassword(input.password, account.passwordHash);

  if (!isValidPassword) {
    throw new AppError(API_ERROR_CODES.UNAUTHORIZED, "Invalid credentials.", 401);
  }

  if (!account.isActive) {
    throw new AppError(API_ERROR_CODES.ACCOUNT_INACTIVE, "Account is inactive.", 403);
  }

  if (account.member.status === "BLOCKED") {
    throw new AppError(API_ERROR_CODES.ACCOUNT_BLOCKED, "Member is blocked.", 403);
  }

  if (account.member.deletedAt) {
    throw new AppError(API_ERROR_CODES.ACCOUNT_INACTIVE, "Account is inactive.", 403);
  }

  await prisma.userAccount.update({
    where: { id: account.id },
    data: { lastLoginAt: new Date() }
  });

  await recordAuditLog({
    actorMemberId: account.memberId,
    action: "LOGIN",
    entityType: "AUTH",
    entityId: account.id,
    ipAddress: input.request?.headers.get("x-forwarded-for") ?? undefined,
    userAgent: input.request?.headers.get("user-agent") ?? undefined
  });

  const tokenPayload = {
    sub: account.id,
    memberId: account.memberId,
    username: account.username,
    role: account.role
  };

  return {
    user: {
      id: account.id,
      memberId: account.memberId,
      username: account.username,
      role: account.role,
      mustChangePassword: account.mustChangePassword,
      displayName: account.member.fullName ?? account.member.alias ?? account.member.initials
    },
    accessToken: await signAccessToken(tokenPayload),
    refreshToken: await signRefreshToken(tokenPayload),
    expiresIn: ACCESS_TOKEN_EXPIRES_IN_SECONDS
  };
}

export async function changePassword(input: {
  userId: string;
  memberId: string;
  currentPassword: string;
  newPassword: string;
}) {
  const account = await prisma.userAccount.findUnique({
    where: { id: input.userId },
    include: { member: true }
  });

  if (!account) {
    throw new AppError(API_ERROR_CODES.NOT_FOUND, "User account not found.", 404);
  }

  const isValidPassword = await verifyPassword(
    input.currentPassword,
    account.passwordHash
  );

  if (!isValidPassword) {
    throw new AppError(API_ERROR_CODES.UNAUTHORIZED, "Current password is incorrect.", 401);
  }

  await prisma.userAccount.update({
    where: { id: input.userId },
    data: {
      passwordHash: await hashPassword(input.newPassword),
      mustChangePassword: false
    }
  });

  await recordAuditLog({
    actorMemberId: input.memberId,
    action: "PASSWORD_CHANGED",
    entityType: "AUTH",
    entityId: input.userId
  });

  return { ok: true };
}

export async function getMe(userId: string) {
  const account = await prisma.userAccount.findUnique({
    where: { id: userId },
    include: { member: true }
  });

  if (!account) {
    throw new AppError(API_ERROR_CODES.NOT_FOUND, "User account not found.", 404);
  }

  return {
    user: {
      id: account.id,
      memberId: account.memberId,
      username: account.username,
      role: account.role,
      mustChangePassword: account.mustChangePassword,
      isActive: account.isActive
    },
    member: toAdminMemberDto({ ...account.member, userAccount: account })
  };
}
