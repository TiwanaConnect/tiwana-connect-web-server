import { apiSuccess } from "@/lib/api/response";
import { withApiHandler } from "@/lib/api/route-handler";
import { requireSession } from "@/lib/auth/session";
import { markAllNotificationsRead } from "@/server/services/notification.service";

export const runtime = "nodejs";

export const POST = withApiHandler(async (request) => {
  const session = await requireSession(request);
  return apiSuccess(await markAllNotificationsRead(session.memberId));
});
