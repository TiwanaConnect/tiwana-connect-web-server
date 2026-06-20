import { apiSuccess } from "@/lib/api/response";
import { withApiHandler } from "@/lib/api/route-handler";
import { parseOrThrow } from "@/lib/api/validation";
import { requireSession } from "@/lib/auth/session";
import { notificationPreferenceSchema } from "@/lib/validators/notification.validators";
import { getNotificationPreference, updateNotificationPreference } from "@/server/services/notification-preference.service";

export const runtime = "nodejs";

export const GET = withApiHandler(async (request) => {
  const session = await requireSession(request);
  return apiSuccess(await getNotificationPreference(session.memberId));
});

export const PATCH = withApiHandler(async (request) => {
  const session = await requireSession(request);
  const body = parseOrThrow(notificationPreferenceSchema, await request.json());
  return apiSuccess(await updateNotificationPreference(session.memberId, body));
});
