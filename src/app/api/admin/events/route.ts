import { apiSuccess } from "@/lib/api/response";
import { withApiHandler } from "@/lib/api/route-handler";
import { parseOrThrow } from "@/lib/api/validation";
import { requireSuperAdminSession } from "@/lib/auth/session";
import { adminEventListQuerySchema, createAdminEventSchema } from "@/lib/validators/event.validators";
import { createEvent, listAdminEvents } from "@/server/services/event.service";

export const runtime = "nodejs";

export const GET = withApiHandler(async (request) => {
  await requireSuperAdminSession(request);
  const query = parseOrThrow(adminEventListQuerySchema, Object.fromEntries(request.nextUrl.searchParams.entries()));
  return apiSuccess(await listAdminEvents(query));
});

export const POST = withApiHandler(async (request) => {
  const session = await requireSuperAdminSession(request);
  const body = parseOrThrow(createAdminEventSchema, await request.json());
  return apiSuccess(await createEvent({ ...body, actorMemberId: session.memberId, admin: true }), { status: 201 });
});
