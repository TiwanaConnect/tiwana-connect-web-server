import { apiSuccess } from "@/lib/api/response";
import { withApiHandler } from "@/lib/api/route-handler";
import { parseOrThrow } from "@/lib/api/validation";
import { requireSuperAdminSession } from "@/lib/auth/session";
import { contributionRequestListQuerySchema } from "@/lib/validators/fund.validators";
import { listContributionRequests } from "@/server/services/fund-request.service";

export const runtime = "nodejs";

export const GET = withApiHandler(async (request) => {
  const session = await requireSuperAdminSession(request);
  const query = parseOrThrow(contributionRequestListQuerySchema, Object.fromEntries(request.nextUrl.searchParams.entries()));
  return apiSuccess(await listContributionRequests({ ...query, viewerRole: session.role, admin: true }));
});
