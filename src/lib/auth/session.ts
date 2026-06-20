import type { UserRole } from "@prisma/client";
import type { NextRequest } from "next/server";

import { API_ERROR_CODES, AppError } from "@/lib/api/errors";
import { prisma } from "@/lib/db/prisma";

import { verifyAccessToken, verifyRefreshToken, type AuthTokenPayload } from "./tokens";

export type AuthSession = {
  userId: string;
  memberId: string;
  username: string;
  role: UserRole;
};

function getTokenFromRequest(request: NextRequest) {
  const authorization = request.headers.get("authorization");

  if (authorization?.startsWith("Bearer ")) {
    return authorization.slice("Bearer ".length);
  }

  return request.cookies.get("tc_access_token")?.value ?? null;
}

async function sessionFromPayload(payload: AuthTokenPayload): Promise<AuthSession | null> {
  const account = await prisma.userAccount.findUnique({
    where: { id: payload.sub },
    include: { member: true }
  });

  if (!account || !account.isActive || account.member.deletedAt || account.member.status === "BLOCKED") {
    return null;
  }

  return {
    userId: account.id,
    memberId: account.memberId,
    username: account.username,
    role: account.role
  };
}

export async function getCurrentSessionFromTokens(input: {
  accessToken?: string | null;
  refreshToken?: string | null;
}) {
  if (input.accessToken) {
    try {
      const payload = await verifyAccessToken(input.accessToken);
      const session = await sessionFromPayload(payload);
      if (session) return session;
    } catch {
      // Fall through to refresh token for cookie-backed web sessions.
    }
  }

  if (input.refreshToken) {
    try {
      const payload = await verifyRefreshToken(input.refreshToken);
      return sessionFromPayload(payload);
    } catch {
      return null;
    }
  }

  return null;
}

export async function getCurrentSession(
  request: NextRequest
): Promise<AuthSession | null> {
  const authorization = request.headers.get("authorization");

  if (authorization?.startsWith("Bearer ")) {
    try {
      const payload = await verifyAccessToken(authorization.slice("Bearer ".length));
      return sessionFromPayload(payload);
    } catch {
      return null;
    }
  }

  return getCurrentSessionFromTokens({
    accessToken: getTokenFromRequest(request),
    refreshToken: request.cookies.get("tc_refresh_token")?.value ?? null
  });
}

export async function requireSession(request: NextRequest) {
  const session = await getCurrentSession(request);

  if (!session) {
    throw new AppError(API_ERROR_CODES.UNAUTHORIZED, "Authentication required.", 401);
  }

  return session;
}

export async function requireSuperAdminSession(request: NextRequest) {
  const session = await requireSession(request);

  if (session.role !== "SUPER_ADMIN") {
    throw new AppError(API_ERROR_CODES.FORBIDDEN, "Super Admin access required.", 403);
  }

  return session;
}
