import { apiSuccess } from "@/lib/api/response";
import { withApiHandler } from "@/lib/api/route-handler";
import { requireSession } from "@/lib/auth/session";
import { listMobileEvents } from "@/server/services/event.service";

export const runtime = "nodejs";

export const GET = withApiHandler(async (request) => {
  const session = await requireSession(request);
  const result = await listMobileEvents({ memberId: session.memberId, role: session.role, status: "all", limit: 50 });
  return apiSuccess({
    events: result.events.filter((event) => event.createdByMemberId === session.memberId),
    nextCursor: null
  });
});
