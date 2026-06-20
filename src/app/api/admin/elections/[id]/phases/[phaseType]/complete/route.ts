import { apiSuccess } from "@/lib/api/response";
import { withApiHandler } from "@/lib/api/route-handler";
import { parseOrThrow } from "@/lib/api/validation";
import { requireSuperAdminSession } from "@/lib/auth/session";
import { phaseParamsSchema } from "@/lib/validators/election.validators";
import { completeElectionPhase } from "@/server/services/election-phase.service";

export const runtime = "nodejs";
type Context = { params: Promise<{ id: string; phaseType: string }> };

export const POST = withApiHandler(async (request, context) => {
  const session = await requireSuperAdminSession(request);
  const { id, phaseType } = await (context as Context).params;
  const params = parseOrThrow(phaseParamsSchema, { phaseType });
  return apiSuccess(await completeElectionPhase({ electionId: id, phaseType: params.phaseType, actorMemberId: session.memberId }));
});
