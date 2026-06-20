import { apiSuccess } from "@/lib/api/response";
import { withApiHandler } from "@/lib/api/route-handler";
import { parseOrThrow } from "@/lib/api/validation";
import { requireSuperAdminSession } from "@/lib/auth/session";
import { fundTransactionListQuerySchema } from "@/lib/validators/fund.validators";
import { listFundTransactions } from "@/server/services/fund-transaction.service";

export const runtime = "nodejs";

export const GET = withApiHandler(async (request) => {
  const session = await requireSuperAdminSession(request);
  const query = parseOrThrow(fundTransactionListQuerySchema, Object.fromEntries(request.nextUrl.searchParams.entries()));
  return apiSuccess(await listFundTransactions({ ...query, viewerRole: session.role, admin: true }));
});
