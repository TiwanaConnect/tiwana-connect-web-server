import { apiSuccess } from "@/lib/api/response";
import { withApiHandler } from "@/lib/api/route-handler";
import { parseOrThrow } from "@/lib/api/validation";
import { requireSession } from "@/lib/auth/session";
import { changePasswordSchema } from "@/lib/validators/auth.validators";
import { changePassword } from "@/server/services/auth.service";

export const runtime = "nodejs";

export const POST = withApiHandler(async (request) => {
  const session = await requireSession(request);
  const body = parseOrThrow(changePasswordSchema, await request.json());

  return apiSuccess(
    await changePassword({
      userId: session.userId,
      memberId: session.memberId,
      ...body
    })
  );
});
