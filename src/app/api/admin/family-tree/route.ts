import { apiSuccess } from "@/lib/api/response";
import { withApiHandler } from "@/lib/api/route-handler";
import { parseOrThrow } from "@/lib/api/validation";
import { requireSuperAdminSession } from "@/lib/auth/session";
import { familyTreeQuerySchema } from "@/lib/validators/family-tree.validators";
import { buildFamilyTreeForMember } from "@/server/services/family-tree.service";

export const runtime = "nodejs";

export const GET = withApiHandler(async (request) => {
  const session = await requireSuperAdminSession(request);
  const query = parseOrThrow(
    familyTreeQuerySchema,
    Object.fromEntries(request.nextUrl.searchParams.entries())
  );

  return apiSuccess(
    await buildFamilyTreeForMember({
      viewer: { memberId: session.memberId, role: session.role },
      focusMemberId: query.focusMemberId ?? session.memberId,
      generationDepth: query.generations,
      viewMode: query.viewMode,
      includeHiddenNames: query.includeHiddenNames
    })
  );
});
