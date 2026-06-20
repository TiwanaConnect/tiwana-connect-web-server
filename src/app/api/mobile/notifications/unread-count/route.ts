import { apiSuccess } from "@/lib/api/response";
import { withApiHandler } from "@/lib/api/route-handler";
import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export const runtime = "nodejs";

export const GET = withApiHandler(async (request) => {
  const session = await requireSession(request);
  return apiSuccess({ unreadCount: await prisma.notification.count({ where: { memberId: session.memberId, status: "UNREAD", deletedAt: null } }) });
});
