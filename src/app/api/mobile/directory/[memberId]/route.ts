import { apiSuccess } from "@/lib/api/response";
import { withApiHandler } from "@/lib/api/route-handler";
import { requireSession } from "@/lib/auth/session";
import { getDirectoryMember } from "@/server/services/directory.service";

export const runtime = "nodejs";

type Context = { params: Promise<{ memberId: string }> };

export const GET = withApiHandler(async (request, context) => {
  const session = await requireSession(request);
  const { memberId } = await (context as Context).params;
  return apiSuccess(await getDirectoryMember({ memberId, viewerMemberId: session.memberId, viewerRole: session.role }));
});
