import { apiSuccess } from "@/lib/api/response";
import { withApiHandler } from "@/lib/api/route-handler";
import { parseOrThrow } from "@/lib/api/validation";
import { requireSuperAdminSession } from "@/lib/auth/session";
import { notificationListQuerySchema } from "@/lib/validators/notification.validators";
import { prisma } from "@/lib/db/prisma";

export const runtime = "nodejs";

export const GET = withApiHandler(async (request) => {
  await requireSuperAdminSession(request);
  const query = parseOrThrow(notificationListQuerySchema, Object.fromEntries(request.nextUrl.searchParams.entries()));
  const notifications = await prisma.notification.findMany({
    where: { deletedAt: null, ...(query.status ? { status: query.status } : {}) },
    include: { member: true, pushDeliveries: true },
    orderBy: { createdAt: "desc" },
    ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
    take: query.limit + 1
  });
  return apiSuccess({ notifications: notifications.slice(0, query.limit), nextCursor: notifications.length > query.limit ? notifications[query.limit]?.id ?? null : null });
});
