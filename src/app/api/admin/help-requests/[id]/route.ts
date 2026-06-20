import { apiSuccess } from "@/lib/api/response";
import { withApiHandler } from "@/lib/api/route-handler";
import { parseOrThrow } from "@/lib/api/validation";
import { requireSuperAdminSession } from "@/lib/auth/session";
import { updateHelpRequestSchema } from "@/lib/validators/help-request.validators";
import { getHelpRequest, updateHelpRequest } from "@/server/services/help-request.service";

export const runtime = "nodejs";

type Context = { params: Promise<{ id: string }> };

export const GET = withApiHandler(async (request, context) => {
  const session = await requireSuperAdminSession(request);
  const { id } = await (context as Context).params;
  return apiSuccess(await getHelpRequest({ id, viewerMemberId: session.memberId, viewerRole: session.role, admin: true }));
});

export const PATCH = withApiHandler(async (request, context) => {
  const session = await requireSuperAdminSession(request);
  const { id } = await (context as Context).params;
  const body = parseOrThrow(updateHelpRequestSchema, await request.json());
  return apiSuccess(await updateHelpRequest({ ...body, requestId: id, actorMemberId: session.memberId }));
});
