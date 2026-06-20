import { apiSuccess } from "@/lib/api/response";
import { withApiHandler } from "@/lib/api/route-handler";
import { requireSuperAdminSession } from "@/lib/auth/session";
import { setMemberStatus } from "@/server/services/member.service";

export const runtime = "nodejs";

type Context = { params: Promise<{ id: string }> };

export const POST = withApiHandler(async (request, context) => {
  const session = await requireSuperAdminSession(request);
  const { id } = await (context as Context).params;

  return apiSuccess(await setMemberStatus(id, "ACTIVE", session.memberId));
});
