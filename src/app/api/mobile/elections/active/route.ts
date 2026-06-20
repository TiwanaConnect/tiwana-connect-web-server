import { apiSuccess } from "@/lib/api/response";
import { withApiHandler } from "@/lib/api/route-handler";
import { requireSession } from "@/lib/auth/session";
import { getActiveElection } from "@/server/services/election.service";

export const runtime = "nodejs";

export const GET = withApiHandler(async (request) => {
  const session = await requireSession(request);
  return apiSuccess(await getActiveElection({ memberId: session.memberId, role: session.role }));
});
