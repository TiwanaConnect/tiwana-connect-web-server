import { API_SERVICE_NAME } from "@/config/constants";
import { apiSuccess } from "@/lib/api/response";
import { withApiHandler } from "@/lib/api/route-handler";

export const runtime = "nodejs";

export const GET = withApiHandler(async () => {
  return apiSuccess({
    ok: true,
    service: API_SERVICE_NAME,
    timestamp: new Date().toISOString()
  });
});
