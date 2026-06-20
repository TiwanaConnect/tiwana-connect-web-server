import { apiSuccess } from "@/lib/api/response";
import { withApiHandler } from "@/lib/api/route-handler";
import { requireSession } from "@/lib/auth/session";
import { getFundDetail } from "@/server/services/fund.service";

export const runtime = "nodejs";

type Context = { params: Promise<{ id: string }> };

export const GET = withApiHandler(async (request, context) => {
  const session = await requireSession(request);
  const { id } = await (context as Context).params;
  return apiSuccess(await getFundDetail({ fundId: id, viewerMemberId: session.memberId, viewerRole: session.role }));
});
