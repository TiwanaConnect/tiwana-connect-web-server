import { apiSuccess } from "@/lib/api/response";
import { withApiHandler } from "@/lib/api/route-handler";
import { parseOrThrow } from "@/lib/api/validation";
import { requireSession } from "@/lib/auth/session";
import { helpRequestListQuerySchema } from "@/lib/validators/help-request.validators";
import { listHelpRequests } from "@/server/services/help-request.service";

export const runtime = "nodejs";

export const GET = withApiHandler(async (request) => {
  const session = await requireSession(request);
  const query = parseOrThrow(helpRequestListQuerySchema, Object.fromEntries(request.nextUrl.searchParams.entries()));
  return apiSuccess(await listHelpRequests({ ...query, viewerMemberId: session.memberId, viewerRole: session.role, direction: "received" }));
});
