import { apiSuccess } from "@/lib/api/response";
import { withApiHandler } from "@/lib/api/route-handler";
import { parseOrThrow } from "@/lib/api/validation";
import { requireSuperAdminSession } from "@/lib/auth/session";
import { pushDeliveryQuerySchema } from "@/lib/validators/notification.validators";
import { prisma } from "@/lib/db/prisma";

export const runtime = "nodejs";

export const GET = withApiHandler(async (request) => {
  await requireSuperAdminSession(request);
  const query = parseOrThrow(pushDeliveryQuerySchema, Object.fromEntries(request.nextUrl.searchParams.entries()));
  const deliveries = await prisma.pushDelivery.findMany({
    where: {
      ...(query.memberId ? { memberId: query.memberId } : {}),
      ...(query.status ? { status: query.status as never } : {}),
      ...(query.provider ? { provider: query.provider as never } : {}),
      ...(query.fromDate || query.toDate ? { createdAt: { ...(query.fromDate ? { gte: new Date(query.fromDate) } : {}), ...(query.toDate ? { lte: new Date(query.toDate) } : {}) } } : {})
    },
    include: { member: true, pushToken: true, notification: true },
    orderBy: { createdAt: "desc" },
    ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
    take: query.limit + 1
  });
  return apiSuccess({ deliveries: deliveries.slice(0, query.limit), nextCursor: deliveries.length > query.limit ? deliveries[query.limit]?.id ?? null : null });
});
