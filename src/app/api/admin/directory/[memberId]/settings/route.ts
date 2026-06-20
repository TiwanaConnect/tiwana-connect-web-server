import { apiSuccess } from "@/lib/api/response";
import { withApiHandler } from "@/lib/api/route-handler";
import { parseOrThrow } from "@/lib/api/validation";
import { requireSuperAdminSession } from "@/lib/auth/session";
import { updateDirectorySettingsSchema } from "@/lib/validators/directory.validators";
import { updateDirectorySettings } from "@/server/services/directory.service";

export const runtime = "nodejs";

type Context = { params: Promise<{ memberId: string }> };

export const PATCH = withApiHandler(async (request, context) => {
  const session = await requireSuperAdminSession(request);
  const { memberId } = await (context as Context).params;
  const body = parseOrThrow(updateDirectorySettingsSchema, await request.json());
  return apiSuccess(await updateDirectorySettings({ ...body, memberId, actorMemberId: session.memberId, admin: true }));
});
