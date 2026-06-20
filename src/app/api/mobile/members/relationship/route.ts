import { apiSuccess } from "@/lib/api/response";
import { withApiHandler } from "@/lib/api/route-handler";
import { parseOrThrow } from "@/lib/api/validation";
import { requireSession } from "@/lib/auth/session";
import { relationshipQuerySchema } from "@/lib/validators/family-tree.validators";
import { findRelationship } from "@/server/services/relationship-finder.service";

export const runtime = "nodejs";

export const GET = withApiHandler(async (request) => {
  const session = await requireSession(request);
  const query = parseOrThrow(
    relationshipQuerySchema,
    Object.fromEntries(request.nextUrl.searchParams.entries())
  );

  return apiSuccess(
    await findRelationship({
      viewer: { memberId: session.memberId, role: session.role },
      startMemberId: query.startMemberId,
      targetMemberId: query.targetMemberId,
      allowAnyStart: false,
      includeHiddenNames: false
    })
  );
});
