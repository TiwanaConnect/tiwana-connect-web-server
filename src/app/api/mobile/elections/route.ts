import { apiSuccess } from "@/lib/api/response";
import { withApiHandler } from "@/lib/api/route-handler";
import { parseOrThrow } from "@/lib/api/validation";
import { requireSession } from "@/lib/auth/session";
import { electionListQuerySchema } from "@/lib/validators/election.validators";
import { listMobileElections } from "@/server/services/election.service";

export const runtime = "nodejs";

export const GET = withApiHandler(async (request) => {
  const session = await requireSession(request);
  const query = parseOrThrow(electionListQuerySchema, Object.fromEntries(request.nextUrl.searchParams.entries()));
  return apiSuccess(await listMobileElections({ ...query, memberId: session.memberId, role: session.role }));
});
