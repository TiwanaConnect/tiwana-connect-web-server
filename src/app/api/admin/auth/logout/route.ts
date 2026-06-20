import { cookies } from "next/headers";

import { apiSuccess } from "@/lib/api/response";
import { withApiHandler } from "@/lib/api/route-handler";

export const runtime = "nodejs";

export const POST = withApiHandler(async () => {
  const cookieStore = await cookies();

  cookieStore.delete("tc_access_token");
  cookieStore.delete("tc_refresh_token");

  return apiSuccess({ ok: true });
});
