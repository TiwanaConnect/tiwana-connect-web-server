import { apiSuccess } from "@/lib/api/response";
import { withApiHandler } from "@/lib/api/route-handler";
import { parseOrThrow } from "@/lib/api/validation";
import { requireSuperAdminSession } from "@/lib/auth/session";
import { scheduleCeremonySchema } from "@/lib/validators/election.validators";
import { scheduleCeremony } from "@/server/services/election-ceremony.service";

export const runtime = "nodejs";
type Context = { params: Promise<{ id: string }> };

export const POST = withApiHandler(async (request, context) => {
  const session = await requireSuperAdminSession(request);
  const { id } = await (context as Context).params;
  const body = parseOrThrow(scheduleCeremonySchema, await request.json());
  return apiSuccess(await scheduleCeremony({ electionId: id, actorMemberId: session.memberId, ceremonyAt: body.ceremonyAt }));
});
