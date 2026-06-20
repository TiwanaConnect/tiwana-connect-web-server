import { apiSuccess } from "@/lib/api/response";
import { withApiHandler } from "@/lib/api/route-handler";
import { parseOrThrow } from "@/lib/api/validation";
import { requireSession } from "@/lib/auth/session";
import { castVoteSchema } from "@/lib/validators/election.validators";
import { castVote } from "@/server/services/election-vote.service";

export const runtime = "nodejs";
type Context = { params: Promise<{ id: string }> };

export const POST = withApiHandler(async (request, context) => {
  const session = await requireSession(request);
  const { id } = await (context as Context).params;
  const body = parseOrThrow(castVoteSchema, await request.json());
  return apiSuccess(await castVote({ electionId: id, memberId: session.memberId, candidateId: body.candidateId }));
});
