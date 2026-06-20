import { apiSuccess } from "@/lib/api/response";
import { withApiHandler } from "@/lib/api/route-handler";
import { requireSuperAdminSession } from "@/lib/auth/session";
import { closeVoting } from "@/server/services/election-vote.service";

export const runtime = "nodejs";
type Context = { params: Promise<{ id: string }> };

export const POST = withApiHandler(async (request, context) => {
  const session = await requireSuperAdminSession(request);
  const { id } = await (context as Context).params;
  return apiSuccess(await closeVoting({ electionId: id, actorMemberId: session.memberId }));
});
