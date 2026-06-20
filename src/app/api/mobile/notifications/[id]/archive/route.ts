import { apiSuccess } from "@/lib/api/response";
import { withApiHandler } from "@/lib/api/route-handler";
import { requireSession } from "@/lib/auth/session";
import { archiveNotification } from "@/server/services/notification.service";

export const runtime = "nodejs";
type Context = { params: Promise<{ id: string }> };

export const POST = withApiHandler(async (request, context) => {
  const session = await requireSession(request);
  const { id } = await (context as Context).params;
  return apiSuccess(await archiveNotification({ memberId: session.memberId, notificationId: id }));
});
