import { apiSuccess } from "@/lib/api/response";
import { withApiHandler } from "@/lib/api/route-handler";
import { parseOrThrow } from "@/lib/api/validation";
import { requireSuperAdminSession } from "@/lib/auth/session";
import { createRelationshipSchema } from "@/lib/validators/relationship.validators";
import {
  createRelationship,
  listRelationshipsForMember
} from "@/server/services/family-relationship.service";

export const runtime = "nodejs";

type Context = { params: Promise<{ id: string }> };

export const GET = withApiHandler(async (request, context) => {
  await requireSuperAdminSession(request);
  const { id } = await (context as Context).params;

  return apiSuccess(await listRelationshipsForMember(id));
});

export const POST = withApiHandler(async (request, context) => {
  const session = await requireSuperAdminSession(request);
  const { id } = await (context as Context).params;
  const body = parseOrThrow(createRelationshipSchema, await request.json());

  return apiSuccess(
    await createRelationship({
      fromMemberId: id,
      ...body,
      actorMemberId: session.memberId
    }),
    { status: 201 }
  );
});
