import { apiSuccess } from "@/lib/api/response";
import { withApiHandler } from "@/lib/api/route-handler";
import { requireSession } from "@/lib/auth/session";
import { getVoteReceipt } from "@/server/services/election-vote.service";

export const runtime = "nodejs";
type Context = { params: Promise<{ id: string }> };

export const GET = withApiHandler(async (request, context) => {
  const session = await requireSession(request);
  const { id } = await (context as Context).params;
  return apiSuccess(await getVoteReceipt({ electionId: id, memberId: session.memberId }));
});
