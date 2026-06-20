import { apiSuccess } from "@/lib/api/response";
import { withApiHandler } from "@/lib/api/route-handler";
import { parseOrThrow } from "@/lib/api/validation";
import { requireSuperAdminSession } from "@/lib/auth/session";
import { bulkTextSchema } from "@/lib/validators/bulk-import.validators";
import { previewBulkMembers } from "@/server/services/bulk-member-import.service";

export const runtime = "nodejs";

export const POST = withApiHandler(async (request) => {
  await requireSuperAdminSession(request);
  const { csv } = parseOrThrow(bulkTextSchema, await request.json());

  return apiSuccess(previewBulkMembers(csv));
});
