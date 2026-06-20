import type { NextRequest } from "next/server";

import { API_ERROR_CODES, AppError } from "./errors";
import { apiError } from "./response";

type RouteHandler = (
  request: NextRequest,
  context?: unknown
) => Response | Promise<Response>;

export function withApiHandler(handler: RouteHandler) {
  return async (request: NextRequest, context?: unknown) => {
    try {
      return await handler(request, context);
    } catch (error) {
      if (error instanceof AppError) {
        return apiError(error.code, error.message, error.status, error.details);
      }

      console.error(error);
      return apiError(
        API_ERROR_CODES.INTERNAL_ERROR,
        "An unexpected error occurred.",
        500
      );
    }
  };
}
