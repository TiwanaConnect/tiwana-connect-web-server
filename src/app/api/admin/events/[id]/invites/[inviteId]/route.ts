import { apiSuccess } from "@/lib/api/response";
import { withApiHandler } from "@/lib/api/route-handler";
import { requireSuperAdminSession } from "@/lib/auth/session";
import { removeEventInvite } from "@/server/services/event.service";

export const runtime = "nodejs";
type Context = { params: Promise<{ id: string; inviteId: string }> };

export const DELETE = withApiHandler(async (request, context) => {
  const session = await requireSuperAdminSession(request);
  const { id, inviteId } = await (context as Context).params;
  return apiSuccess(await removeEventInvite(id, inviteId, session.memberId));
});
