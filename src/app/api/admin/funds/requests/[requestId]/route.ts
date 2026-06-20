import { apiSuccess } from "@/lib/api/response";
import { withApiHandler } from "@/lib/api/route-handler";
import { parseOrThrow } from "@/lib/api/validation";
import { requireSuperAdminSession } from "@/lib/auth/session";
import { updateContributionRequestSchema } from "@/lib/validators/fund.validators";
import { updateContributionRequest } from "@/server/services/fund-request.service";

export const runtime = "nodejs";

type Context = { params: Promise<{ requestId: string }> };

export const PATCH = withApiHandler(async (request, context) => {
  const session = await requireSuperAdminSession(request);
  const { requestId } = await (context as Context).params;
  const body = parseOrThrow(updateContributionRequestSchema, await request.json());
  return apiSuccess(await updateContributionRequest({ ...body, requestId, actorMemberId: session.memberId }));
});
