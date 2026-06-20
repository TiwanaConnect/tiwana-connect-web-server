import { apiSuccess } from "@/lib/api/response";
import { withApiHandler } from "@/lib/api/route-handler";
import { parseOrThrow } from "@/lib/api/validation";
import { requireSuperAdminSession } from "@/lib/auth/session";
import { cancelEventSchema } from "@/lib/validators/event.validators";
import { cancelEvent } from "@/server/services/event.service";

export const runtime = "nodejs";
type Context = { params: Promise<{ id: string }> };

export const POST = withApiHandler(async (request, context) => {
  const session = await requireSuperAdminSession(request);
  const { id } = await (context as Context).params;
  const body = parseOrThrow(cancelEventSchema, await request.json());
  return apiSuccess(await cancelEvent(id, session.memberId, body.reason));
});
