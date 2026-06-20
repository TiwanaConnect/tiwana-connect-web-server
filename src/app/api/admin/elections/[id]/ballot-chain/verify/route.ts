import { apiSuccess } from "@/lib/api/response";
import { withApiHandler } from "@/lib/api/route-handler";
import { requireSuperAdminSession } from "@/lib/auth/session";
import { verifyBallotChain } from "@/server/services/election-vote.service";

export const runtime = "nodejs";
type Context = { params: Promise<{ id: string }> };

export const GET = withApiHandler(async (request, context) => {
  await requireSuperAdminSession(request);
  const { id } = await (context as Context).params;
  return apiSuccess(await verifyBallotChain(id));
});
