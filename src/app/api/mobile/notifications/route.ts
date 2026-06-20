import { apiSuccess } from "@/lib/api/response";
import { withApiHandler } from "@/lib/api/route-handler";
import { parseOrThrow } from "@/lib/api/validation";
import { requireSession } from "@/lib/auth/session";
import { notificationListQuerySchema } from "@/lib/validators/notification.validators";
import { listMyNotifications } from "@/server/services/notification.service";

export const runtime = "nodejs";

export const GET = withApiHandler(async (request) => {
  const session = await requireSession(request);
  const query = parseOrThrow(notificationListQuerySchema, Object.fromEntries(request.nextUrl.searchParams.entries()));
  return apiSuccess(await listMyNotifications({ ...query, memberId: session.memberId }));
});
