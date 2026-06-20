import { apiSuccess } from "@/lib/api/response";
import { withApiHandler } from "@/lib/api/route-handler";
import { parseOrThrow } from "@/lib/api/validation";
import { requireSuperAdminSession } from "@/lib/auth/session";
import { assignTagsSchema } from "@/lib/validators/tag.validators";
import { assignMemberTags, getMemberTags } from "@/server/services/member-tag.service";

export const runtime = "nodejs";

type Context = { params: Promise<{ id: string }> };

export const GET = withApiHandler(async (request, context) => {
  await requireSuperAdminSession(request);
  const { id } = await (context as Context).params;
  return apiSuccess(await getMemberTags(id));
});

export const POST = withApiHandler(async (request, context) => {
  const session = await requireSuperAdminSession(request);
  const { id } = await (context as Context).params;
  const body = parseOrThrow(assignTagsSchema, await request.json());
  return apiSuccess(await assignMemberTags({ memberId: id, tagIds: body.tagIds, actorMemberId: session.memberId }));
});
