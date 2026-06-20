import { apiSuccess } from "@/lib/api/response";
import { withApiHandler } from "@/lib/api/route-handler";
import { parseOrThrow } from "@/lib/api/validation";
import { requireSession } from "@/lib/auth/session";
import { createMobileFundSchema, fundListQuerySchema } from "@/lib/validators/fund.validators";
import { createFund, listMobileFunds } from "@/server/services/fund.service";

export const runtime = "nodejs";

export const GET = withApiHandler(async (request) => {
  const session = await requireSession(request);
  const query = parseOrThrow(fundListQuerySchema, Object.fromEntries(request.nextUrl.searchParams.entries()));
  return apiSuccess(await listMobileFunds({ ...query, memberId: session.memberId, role: session.role }));
});

export const POST = withApiHandler(async (request) => {
  const session = await requireSession(request);
  const body = parseOrThrow(createMobileFundSchema, await request.json());
  return apiSuccess(await createFund({ ...body, actorMemberId: session.memberId, admin: false }), { status: 201 });
});
