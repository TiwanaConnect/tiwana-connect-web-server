import { apiSuccess } from "@/lib/api/response";
import { withApiHandler } from "@/lib/api/route-handler";
import { parseOrThrow } from "@/lib/api/validation";
import { requireSuperAdminSession } from "@/lib/auth/session";
import { createContributionRequestsSchema } from "@/lib/validators/fund.validators";
import { createContributionRequests } from "@/server/services/fund-request.service";

export const runtime = "nodejs";

type Context = { params: Promise<{ id: string }> };

export const POST = withApiHandler(async (request, context) => {
  const session = await requireSuperAdminSession(request);
  const { id } = await (context as Context).params;
  const body = parseOrThrow(createContributionRequestsSchema, await request.json());
  return apiSuccess(await createContributionRequests({ ...body, fundId: id, actorMemberId: session.memberId, admin: true }), { status: 201 });
});
