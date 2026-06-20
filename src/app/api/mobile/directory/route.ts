import { apiSuccess } from "@/lib/api/response";
import { withApiHandler } from "@/lib/api/route-handler";
import { parseOrThrow } from "@/lib/api/validation";
import { requireSession } from "@/lib/auth/session";
import { directoryListQuerySchema } from "@/lib/validators/directory.validators";
import { listMobileDirectory } from "@/server/services/directory.service";

export const runtime = "nodejs";

export const GET = withApiHandler(async (request) => {
  const session = await requireSession(request);
  const query = parseOrThrow(directoryListQuerySchema, Object.fromEntries(request.nextUrl.searchParams.entries()));
  return apiSuccess(await listMobileDirectory({ ...query, viewerMemberId: session.memberId, viewerRole: session.role }));
});
