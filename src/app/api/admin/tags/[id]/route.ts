import { apiSuccess } from "@/lib/api/response";
import { withApiHandler } from "@/lib/api/route-handler";
import { parseOrThrow } from "@/lib/api/validation";
import { requireSuperAdminSession } from "@/lib/auth/session";
import { updateTagSchema } from "@/lib/validators/tag.validators";
import { disableTag, updateTag } from "@/server/services/member-tag.service";

export const runtime = "nodejs";

type Context = { params: Promise<{ id: string }> };

export const PATCH = withApiHandler(async (request, context) => {
  const session = await requireSuperAdminSession(request);
  const { id } = await (context as Context).params;
  const body = parseOrThrow(updateTagSchema, await request.json());
  return apiSuccess(await updateTag(id, { ...body, actorMemberId: session.memberId }));
});

export const DELETE = withApiHandler(async (request, context) => {
  const session = await requireSuperAdminSession(request);
  const { id } = await (context as Context).params;
  return apiSuccess(await disableTag(id, session.memberId));
});
