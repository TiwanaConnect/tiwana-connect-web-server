import { apiSuccess } from "@/lib/api/response";
import { withApiHandler } from "@/lib/api/route-handler";
import { parseOrThrow } from "@/lib/api/validation";
import { requireSession } from "@/lib/auth/session";
import { respondHelpRequestSchema } from "@/lib/validators/help-request.validators";
import { respondHelpRequest } from "@/server/services/help-request.service";

export const runtime = "nodejs";

type Context = { params: Promise<{ id: string }> };

export const POST = withApiHandler(async (request, context) => {
  const session = await requireSession(request);
  const { id } = await (context as Context).params;
  const body = parseOrThrow(respondHelpRequestSchema, await request.json());
  return apiSuccess(await respondHelpRequest({ ...body, requestId: id, actorMemberId: session.memberId, actorRole: session.role }));
});
