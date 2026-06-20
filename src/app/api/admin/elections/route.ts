import { apiSuccess } from "@/lib/api/response";
import { withApiHandler } from "@/lib/api/route-handler";
import { parseOrThrow } from "@/lib/api/validation";
import { requireSuperAdminSession } from "@/lib/auth/session";
import { createElectionSchema, electionListQuerySchema } from "@/lib/validators/election.validators";
import { createElection, listAdminElections } from "@/server/services/election.service";

export const runtime = "nodejs";

export const GET = withApiHandler(async (request) => {
  await requireSuperAdminSession(request);
  const query = parseOrThrow(electionListQuerySchema, Object.fromEntries(request.nextUrl.searchParams.entries()));
  return apiSuccess(await listAdminElections(query));
});

export const POST = withApiHandler(async (request) => {
  const session = await requireSuperAdminSession(request);
  const body = parseOrThrow(createElectionSchema, await request.json());
  return apiSuccess(await createElection({ ...body, actorMemberId: session.memberId }), { status: 201 });
});
