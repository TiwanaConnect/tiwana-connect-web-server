import { apiSuccess } from "@/lib/api/response";
import { withApiHandler } from "@/lib/api/route-handler";
import { parseOrThrow } from "@/lib/api/validation";
import { requireSuperAdminSession } from "@/lib/auth/session";
import { sendTestPushSchema } from "@/lib/validators/notification.validators";
import { notifyMembers } from "@/server/services/notification.service";

export const runtime = "nodejs";

export const POST = withApiHandler(async (request) => {
  await requireSuperAdminSession(request);
  const body = parseOrThrow(sendTestPushSchema, await request.json());
  return apiSuccess(await notifyMembers({
    memberIds: body.memberIds,
    type: "SYSTEM",
    title: body.title,
    body: body.body,
    entityType: "SYSTEM",
    actionUrl: "/notifications",
    priority: "HIGH",
    push: true
  }));
});
