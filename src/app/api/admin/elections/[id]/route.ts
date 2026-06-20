import { apiSuccess } from "@/lib/api/response";
import { withApiHandler } from "@/lib/api/route-handler";
import { parseOrThrow } from "@/lib/api/validation";
import { requireSuperAdminSession } from "@/lib/auth/session";
import { updateElectionSchema } from "@/lib/validators/election.validators";
import { getElectionDetail, updateElection } from "@/server/services/election.service";

export const runtime = "nodejs";
type Context = { params: Promise<{ id: string }> };

export const GET = withApiHandler(async (request, context) => {
  const session = await requireSuperAdminSession(request);
  const { id } = await (context as Context).params;
  return apiSuccess(await getElectionDetail({ electionId: id, viewerMemberId: session.memberId, viewerRole: session.role, admin: true }));
});

export const PATCH = withApiHandler(async (request, context) => {
  const session = await requireSuperAdminSession(request);
  const { id } = await (context as Context).params;
  const body = parseOrThrow(updateElectionSchema, await request.json());
  return apiSuccess(await updateElection(id, { ...body, actorMemberId: session.memberId }));
});
