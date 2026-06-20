import { apiSuccess } from "@/lib/api/response";
import { withApiHandler } from "@/lib/api/route-handler";
import { parseOrThrow } from "@/lib/api/validation";
import { requireSuperAdminSession } from "@/lib/auth/session";
import { rejectNominationSchema } from "@/lib/validators/election.validators";
import { rejectNomination } from "@/server/services/election-nomination.service";

export const runtime = "nodejs";
type Context = { params: Promise<{ id: string; nominationId: string }> };

export const POST = withApiHandler(async (request, context) => {
  const session = await requireSuperAdminSession(request);
  const { id, nominationId } = await (context as Context).params;
  const body = parseOrThrow(rejectNominationSchema, await request.json());
  return apiSuccess(await rejectNomination({ electionId: id, nominationId, actorMemberId: session.memberId, reason: body.reason }));
});
