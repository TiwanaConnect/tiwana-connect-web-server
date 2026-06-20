import { apiSuccess } from "@/lib/api/response";
import { withApiHandler } from "@/lib/api/route-handler";
import { parseOrThrow } from "@/lib/api/validation";
import { requireSuperAdminSession } from "@/lib/auth/session";
import { generateLoginSchema } from "@/lib/validators/member.validators";
import { generateLoginAccess } from "@/server/services/user-account.service";

export const runtime = "nodejs";

type Context = { params: Promise<{ id: string }> };

export const POST = withApiHandler(async (request, context) => {
  const session = await requireSuperAdminSession(request);
  const { id } = await (context as Context).params;
  const body = parseOrThrow(generateLoginSchema, await request.json());

  return apiSuccess(
    await generateLoginAccess({
      memberId: id,
      ...body,
      actorMemberId: session.memberId
    })
  );
});
