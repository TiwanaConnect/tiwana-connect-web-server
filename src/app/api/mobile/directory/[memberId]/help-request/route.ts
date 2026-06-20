import { apiSuccess } from "@/lib/api/response";
import { withApiHandler } from "@/lib/api/route-handler";
import { parseOrThrow } from "@/lib/api/validation";
import { requireSession } from "@/lib/auth/session";
import { sendHelpRequestSchema } from "@/lib/validators/help-request.validators";
import { sendHelpRequest } from "@/server/services/help-request.service";

export const runtime = "nodejs";

type Context = { params: Promise<{ memberId: string }> };

export const POST = withApiHandler(async (request, context) => {
  const session = await requireSession(request);
  const { memberId } = await (context as Context).params;
  const body = parseOrThrow(sendHelpRequestSchema, await request.json());
  return apiSuccess(await sendHelpRequest({ ...body, fromMemberId: session.memberId, toMemberId: memberId }), { status: 201 });
});
