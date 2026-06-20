import { apiSuccess } from "@/lib/api/response";
import { withApiHandler } from "@/lib/api/route-handler";
import { parseOrThrow } from "@/lib/api/validation";
import { requireSession } from "@/lib/auth/session";
import { rsvpSchema } from "@/lib/validators/event.validators";
import { rsvpToEvent } from "@/server/services/event-invite.service";

export const runtime = "nodejs";
type Context = { params: Promise<{ id: string }> };

export const POST = withApiHandler(async (request, context) => {
  const session = await requireSession(request);
  const { id } = await (context as Context).params;
  const body = parseOrThrow(rsvpSchema, await request.json());
  return apiSuccess(await rsvpToEvent({ eventId: id, memberId: session.memberId, role: session.role, status: body.status, note: body.note }));
});
