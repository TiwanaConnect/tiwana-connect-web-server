import { apiSuccess } from "@/lib/api/response";
import { withApiHandler } from "@/lib/api/route-handler";
import { parseOrThrow } from "@/lib/api/validation";
import { requireSession } from "@/lib/auth/session";
import { rejectFundTransactionSchema } from "@/lib/validators/fund.validators";
import { rejectGeneralFundTransaction } from "@/server/services/fund-transaction.service";

export const runtime = "nodejs";

type Context = { params: Promise<{ transactionId: string }> };

export const POST = withApiHandler(async (request, context) => {
  const session = await requireSession(request);
  const { transactionId } = await (context as Context).params;
  const body = parseOrThrow(rejectFundTransactionSchema, await request.json());
  return apiSuccess(
    await rejectGeneralFundTransaction({
      transactionId,
      actorMemberId: session.memberId,
      reason: body.reason
    })
  );
});
