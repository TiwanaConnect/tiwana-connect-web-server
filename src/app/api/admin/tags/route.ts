import { apiSuccess } from "@/lib/api/response";
import { withApiHandler } from "@/lib/api/route-handler";
import { parseOrThrow } from "@/lib/api/validation";
import { requireSuperAdminSession } from "@/lib/auth/session";
import { createTagSchema, tagListQuerySchema } from "@/lib/validators/tag.validators";
import { createTag, listTags } from "@/server/services/member-tag.service";

export const runtime = "nodejs";

export const GET = withApiHandler(async (request) => {
  await requireSuperAdminSession(request);
  const query = parseOrThrow(tagListQuerySchema, Object.fromEntries(request.nextUrl.searchParams.entries()));
  return apiSuccess(await listTags(query));
});

export const POST = withApiHandler(async (request) => {
  const session = await requireSuperAdminSession(request);
  const body = parseOrThrow(createTagSchema, await request.json());
  return apiSuccess(await createTag({ ...body, actorMemberId: session.memberId }), { status: 201 });
});
