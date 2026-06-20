import { apiSuccess } from "@/lib/api/response";
import { withApiHandler } from "@/lib/api/route-handler";
import { parseOrThrow } from "@/lib/api/validation";
import { requireSession } from "@/lib/auth/session";
import { registerPushTokenSchema } from "@/lib/validators/notification.validators";
import { registerPushToken } from "@/server/services/push-token.service";

export const runtime = "nodejs";

export const POST = withApiHandler(async (request) => {
  const session = await requireSession(request);
  const body = parseOrThrow(registerPushTokenSchema, await request.json());
  return apiSuccess(await registerPushToken({ ...body, memberId: session.memberId }));
});
