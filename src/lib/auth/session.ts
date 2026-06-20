import type { UserRole } from "@prisma/client";
import type { NextRequest } from "next/server";

import { API_ERROR_CODES, AppError } from "@/lib/api/errors";

import { verifyAccessToken } from "./tokens";

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

export async function getCurrentSession(
  request: NextRequest
): Promise<AuthSession | null> {
  const token = getTokenFromRequest(request);

  if (!token) {
    return null;
  }

  try {
    const payload = await verifyAccessToken(token);

    return {
      userId: payload.sub,
      memberId: payload.memberId,
      username: payload.username,
      role: payload.role
    };
  } catch {
    return null;
  }
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
