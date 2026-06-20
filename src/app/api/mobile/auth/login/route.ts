import { apiSuccess } from "@/lib/api/response";
import { withApiHandler } from "@/lib/api/route-handler";
import { parseOrThrow } from "@/lib/api/validation";
import { loginSchema } from "@/lib/validators/auth.validators";
import { loginWithPassword } from "@/server/services/auth.service";

export const runtime = "nodejs";

export const POST = withApiHandler(async (request) => {
  const body = parseOrThrow(loginSchema, await request.json());
  return apiSuccess(await loginWithPassword({ ...body, request }));
});
