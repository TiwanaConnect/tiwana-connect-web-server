import { apiSuccess } from "@/lib/api/response";
import { withApiHandler } from "@/lib/api/route-handler";
import { parseOrThrow } from "@/lib/api/validation";
import { requireSuperAdminSession } from "@/lib/auth/session";
import { updateEventSchema } from "@/lib/validators/event.validators";
import { getEventDetail, updateEvent } from "@/server/services/event.service";

export const runtime = "nodejs";

type Context = { params: Promise<{ id: string }> };

export const GET = withApiHandler(async (request, context) => {
  const session = await requireSuperAdminSession(request);
  const { id } = await (context as Context).params;
  return apiSuccess(await getEventDetail({ eventId: id, viewerMemberId: session.memberId, viewerRole: session.role, admin: true }));
});

export const PATCH = withApiHandler(async (request, context) => {
  const session = await requireSuperAdminSession(request);
  const { id } = await (context as Context).params;
  const body = parseOrThrow(updateEventSchema, await request.json());
  return apiSuccess(await updateEvent(id, { ...body, actorMemberId: session.memberId, admin: true }));
});
