import { apiSuccess } from "@/lib/api/response";
import { withApiHandler } from "@/lib/api/route-handler";
import { parseOrThrow } from "@/lib/api/validation";
import { requireSuperAdminSession } from "@/lib/auth/session";
import { updateMemberSchema } from "@/lib/validators/member.validators";
import { getMember, softDeleteMember, updateMember } from "@/server/services/member.service";

export const runtime = "nodejs";

type Context = { params: Promise<{ id: string }> };

export const GET = withApiHandler(async (request, context) => {
  await requireSuperAdminSession(request);
  const { id } = await (context as Context).params;

  return apiSuccess(await getMember(id));
});

export const PATCH = withApiHandler(async (request, context) => {
  const session = await requireSuperAdminSession(request);
  const { id } = await (context as Context).params;
  const body = parseOrThrow(updateMemberSchema, await request.json());

  return apiSuccess(
    await updateMember(id, {
      ...body,
      actorMemberId: session.memberId
    })
  );
});

export const DELETE = withApiHandler(async (request, context) => {
  const session = await requireSuperAdminSession(request);
  const { id } = await (context as Context).params;

  return apiSuccess(await softDeleteMember(id, session.memberId));
});
