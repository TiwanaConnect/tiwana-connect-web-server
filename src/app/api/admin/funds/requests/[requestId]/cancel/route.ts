import { apiSuccess } from "@/lib/api/response";
import { withApiHandler } from "@/lib/api/route-handler";
import { requireSuperAdminSession } from "@/lib/auth/session";
import { setContributionRequestStatus } from "@/server/services/fund-request.service";

export const runtime = "nodejs";

type Context = { params: Promise<{ requestId: string }> };

export const POST = withApiHandler(async (request, context) => {
  const session = await requireSuperAdminSession(request);
  const { requestId } = await (context as Context).params;
  return apiSuccess(await setContributionRequestStatus({ requestId, status: "CANCELLED", actorMemberId: session.memberId }));
});
