import { apiSuccess } from "@/lib/api/response";
import { withApiHandler } from "@/lib/api/route-handler";
import { requireSuperAdminSession } from "@/lib/auth/session";
import { removeMemberTag } from "@/server/services/member-tag.service";

export const runtime = "nodejs";

type Context = { params: Promise<{ id: string; tagId: string }> };

export const DELETE = withApiHandler(async (request, context) => {
  const session = await requireSuperAdminSession(request);
  const { id, tagId } = await (context as Context).params;
  return apiSuccess(await removeMemberTag({ memberId: id, tagId, actorMemberId: session.memberId }));
});
