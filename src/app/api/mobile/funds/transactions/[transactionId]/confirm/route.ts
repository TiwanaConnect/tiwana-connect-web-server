import { apiSuccess } from "@/lib/api/response";
import { withApiHandler } from "@/lib/api/route-handler";
import { requireSession } from "@/lib/auth/session";
import { confirmGeneralFundTransaction } from "@/server/services/fund-transaction.service";

export const runtime = "nodejs";

type Context = { params: Promise<{ transactionId: string }> };

export const POST = withApiHandler(async (request, context) => {
  const session = await requireSession(request);
  const { transactionId } = await (context as Context).params;
  return apiSuccess(
    await confirmGeneralFundTransaction({
      transactionId,
      actorMemberId: session.memberId
    })
  );
});
