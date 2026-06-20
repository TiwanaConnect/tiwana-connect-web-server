import { apiSuccess } from "@/lib/api/response";
import { withApiHandler } from "@/lib/api/route-handler";
import { parseOrThrow } from "@/lib/api/validation";
import { requireSuperAdminSession } from "@/lib/auth/session";
import { createAdminFundSchema, fundListQuerySchema } from "@/lib/validators/fund.validators";
import { createFund, listAdminFunds } from "@/server/services/fund.service";

export const runtime = "nodejs";

export const GET = withApiHandler(async (request) => {
  await requireSuperAdminSession(request);
  const query = parseOrThrow(fundListQuerySchema, Object.fromEntries(request.nextUrl.searchParams.entries()));
  return apiSuccess(await listAdminFunds(query));
});

export const POST = withApiHandler(async (request) => {
  const session = await requireSuperAdminSession(request);
  const body = parseOrThrow(createAdminFundSchema, await request.json());
  return apiSuccess(await createFund({ ...body, actorMemberId: session.memberId, admin: true }), { status: 201 });
});
