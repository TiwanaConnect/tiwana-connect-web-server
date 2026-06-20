import { apiSuccess } from "@/lib/api/response";
import { withApiHandler } from "@/lib/api/route-handler";
import { requireSuperAdminSession } from "@/lib/auth/session";
import { confirmFundTransaction } from "@/server/services/fund-transaction.service";

export const runtime = "nodejs";

type Context = { params: Promise<{ transactionId: string }> };

export const POST = withApiHandler(async (request, context) => {
  const session = await requireSuperAdminSession(request);
  const { transactionId } = await (context as Context).params;
  return apiSuccess(await confirmFundTransaction({ transactionId, actorMemberId: session.memberId }));
});
