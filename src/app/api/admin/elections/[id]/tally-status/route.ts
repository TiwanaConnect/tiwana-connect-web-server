import { apiSuccess } from "@/lib/api/response";
import { withApiHandler } from "@/lib/api/route-handler";
import { requireSuperAdminSession } from "@/lib/auth/session";
import { getTallyStatus } from "@/server/services/election-result.service";

export const runtime = "nodejs";
type Context = { params: Promise<{ id: string }> };

export const GET = withApiHandler(async (request, context) => {
  await requireSuperAdminSession(request);
  const { id } = await (context as Context).params;
  return apiSuccess(await getTallyStatus(id));
});
