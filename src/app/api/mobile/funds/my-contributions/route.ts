import { apiSuccess } from "@/lib/api/response";
import { withApiHandler } from "@/lib/api/route-handler";
import { parseOrThrow } from "@/lib/api/validation";
import { requireSession } from "@/lib/auth/session";
import { fundTransactionListQuerySchema } from "@/lib/validators/fund.validators";
import { listFundTransactions } from "@/server/services/fund-transaction.service";

export const runtime = "nodejs";

export const GET = withApiHandler(async (request) => {
  const session = await requireSession(request);
  const query = parseOrThrow(fundTransactionListQuerySchema, Object.fromEntries(request.nextUrl.searchParams.entries()));
  return apiSuccess(await listFundTransactions({ ...query, memberId: session.memberId, viewerRole: session.role }));
});
