import { apiSuccess } from "@/lib/api/response";
import { withApiHandler } from "@/lib/api/route-handler";
import { parseOrThrow } from "@/lib/api/validation";
import { requireSuperAdminSession } from "@/lib/auth/session";
import { updateFundSchema } from "@/lib/validators/fund.validators";
import { getFundDetail, updateFund } from "@/server/services/fund.service";

export const runtime = "nodejs";

type Context = { params: Promise<{ id: string }> };

export const GET = withApiHandler(async (request, context) => {
  const session = await requireSuperAdminSession(request);
  const { id } = await (context as Context).params;
  return apiSuccess(await getFundDetail({ fundId: id, viewerMemberId: session.memberId, viewerRole: session.role, admin: true }));
});

export const PATCH = withApiHandler(async (request, context) => {
  const session = await requireSuperAdminSession(request);
  const { id } = await (context as Context).params;
  const body = parseOrThrow(updateFundSchema, await request.json());
  return apiSuccess(await updateFund(id, { ...body, actorMemberId: session.memberId, admin: true }));
});
