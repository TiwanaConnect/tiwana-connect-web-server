import { apiSuccess } from "@/lib/api/response";
import { withApiHandler } from "@/lib/api/route-handler";
import { parseOrThrow } from "@/lib/api/validation";
import { requireSession } from "@/lib/auth/session";
import { createMobileEventSchema, mobileEventListQuerySchema } from "@/lib/validators/event.validators";
import { createEvent, listMobileEvents } from "@/server/services/event.service";

export const runtime = "nodejs";

export const GET = withApiHandler(async (request) => {
  const session = await requireSession(request);
  const query = parseOrThrow(mobileEventListQuerySchema, Object.fromEntries(request.nextUrl.searchParams.entries()));
  return apiSuccess(await listMobileEvents({ memberId: session.memberId, role: session.role, ...query }));
});

export const POST = withApiHandler(async (request) => {
  const session = await requireSession(request);
  const body = parseOrThrow(createMobileEventSchema, await request.json());
  return apiSuccess(await createEvent({ ...body, actorMemberId: session.memberId, admin: false }), { status: 201 });
});
