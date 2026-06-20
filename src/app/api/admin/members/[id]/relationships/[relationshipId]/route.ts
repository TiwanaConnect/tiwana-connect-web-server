import { apiSuccess } from "@/lib/api/response";
import { withApiHandler } from "@/lib/api/route-handler";
import { requireSuperAdminSession } from "@/lib/auth/session";
import { deleteRelationship } from "@/server/services/family-relationship.service";

export const runtime = "nodejs";

type Context = { params: Promise<{ id: string; relationshipId: string }> };

export const DELETE = withApiHandler(async (request, context) => {
  const session = await requireSuperAdminSession(request);
  const { id, relationshipId } = await (context as Context).params;

  return apiSuccess(
    await deleteRelationship({
      memberId: id,
      relationshipId,
      actorMemberId: session.memberId
    })
  );
});
