import { apiSuccess } from "@/lib/api/response";
import { withApiHandler } from "@/lib/api/route-handler";
import { parseOrThrow } from "@/lib/api/validation";
import { requireSession } from "@/lib/auth/session";
import { createMobileContributionSchema } from "@/lib/validators/fund.validators";
import { createFundTransaction } from "@/server/services/fund-transaction.service";

export const runtime = "nodejs";

type Context = { params: Promise<{ id: string }> };

export const POST = withApiHandler(async (request, context) => {
  const session = await requireSession(request);
  const { id } = await (context as Context).params;
  const body = parseOrThrow(createMobileContributionSchema, await request.json());
  return apiSuccess(await createFundTransaction({ ...body, fundId: id, actorMemberId: session.memberId, admin: false }), { status: 201 });
});
