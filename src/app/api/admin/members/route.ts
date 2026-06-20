import { apiSuccess } from "@/lib/api/response";
import { withApiHandler } from "@/lib/api/route-handler";
import { parseOrThrow } from "@/lib/api/validation";
import { requireSuperAdminSession } from "@/lib/auth/session";
import { createMemberSchema, memberListQuerySchema } from "@/lib/validators/member.validators";
import { createMember, listMembers } from "@/server/services/member.service";

export const runtime = "nodejs";

export const GET = withApiHandler(async (request) => {
  await requireSuperAdminSession(request);
  const params = Object.fromEntries(request.nextUrl.searchParams.entries());
  const filters = parseOrThrow(memberListQuerySchema, params);

  return apiSuccess(await listMembers(filters));
});

export const POST = withApiHandler(async (request) => {
  const session = await requireSuperAdminSession(request);
  const body = parseOrThrow(createMemberSchema, await request.json());

  return apiSuccess(
    await createMember({
      ...body,
      actorMemberId: session.memberId
    }),
    { status: 201 }
  );
});
