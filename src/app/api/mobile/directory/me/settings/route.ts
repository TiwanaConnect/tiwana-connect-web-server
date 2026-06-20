import { apiSuccess } from "@/lib/api/response";
import { withApiHandler } from "@/lib/api/route-handler";
import { parseOrThrow } from "@/lib/api/validation";
import { requireSession } from "@/lib/auth/session";
import { updateDirectorySettingsSchema } from "@/lib/validators/directory.validators";
import { getMyDirectorySettings, updateDirectorySettings } from "@/server/services/directory.service";

export const runtime = "nodejs";

export const GET = withApiHandler(async (request) => {
  const session = await requireSession(request);
  return apiSuccess(await getMyDirectorySettings(session.memberId));
});

export const PATCH = withApiHandler(async (request) => {
  const session = await requireSession(request);
  const body = parseOrThrow(updateDirectorySettingsSchema, await request.json());
  return apiSuccess(await updateDirectorySettings({ ...body, memberId: session.memberId, actorMemberId: session.memberId }));
});
