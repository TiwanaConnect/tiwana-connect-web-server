import { cookies } from "next/headers";

import { API_ERROR_CODES, AppError } from "@/lib/api/errors";
import { apiSuccess } from "@/lib/api/response";
import { withApiHandler } from "@/lib/api/route-handler";
import { parseOrThrow } from "@/lib/api/validation";
import { loginSchema } from "@/lib/validators/auth.validators";
import { loginWithPassword } from "@/server/services/auth.service";

export const runtime = "nodejs";

export const POST = withApiHandler(async (request) => {
  const body = parseOrThrow(loginSchema, await request.json());
  const result = await loginWithPassword({ ...body, request });
  if (result.user.role !== "SUPER_ADMIN") {
    throw new AppError(API_ERROR_CODES.FORBIDDEN, "Super Admin access required.", 403);
  }

  const cookieStore = await cookies();

  cookieStore.set("tc_access_token", result.accessToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: result.expiresIn
  });
  cookieStore.set("tc_refresh_token", result.refreshToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30
  });

  return apiSuccess(result);
});
