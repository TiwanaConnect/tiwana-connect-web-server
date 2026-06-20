import { apiSuccess } from "@/lib/api/response";
import { withApiHandler } from "@/lib/api/route-handler";
import { parseOrThrow } from "@/lib/api/validation";
import { requireSuperAdminSession } from "@/lib/auth/session";
import { bulkTextSchema } from "@/lib/validators/bulk-import.validators";
import { importBulkRelationships } from "@/server/services/bulk-relationship-import.service";

export const runtime = "nodejs";

export const POST = withApiHandler(async (request) => {
  const session = await requireSuperAdminSession(request);
  const { csv } = parseOrThrow(bulkTextSchema, await request.json());

  return apiSuccess(
    await importBulkRelationships({ csv, actorMemberId: session.memberId })
  );
});
