import { apiSuccess } from "@/lib/api/response";
import { withApiHandler } from "@/lib/api/route-handler";
import { requireSuperAdminSession } from "@/lib/auth/session";
import { notificationStats } from "@/server/services/notification.service";

export const runtime = "nodejs";

export const GET = withApiHandler(async (request) => {
  await requireSuperAdminSession(request);
  return apiSuccess(await notificationStats());
});
