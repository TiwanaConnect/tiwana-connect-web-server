import { apiSuccess } from "@/lib/api/response";
import { withApiHandler } from "@/lib/api/route-handler";
import { parseOrThrow } from "@/lib/api/validation";
import { requireSession } from "@/lib/auth/session";
import { unregisterPushTokenSchema } from "@/lib/validators/notification.validators";
import { unregisterPushToken } from "@/server/services/push-token.service";

export const runtime = "nodejs";

export const POST = withApiHandler(async (request) => {
  const session = await requireSession(request);
  const body = parseOrThrow(unregisterPushTokenSchema, await request.json());
  return apiSuccess(await unregisterPushToken({ ...body, memberId: session.memberId }));
});
