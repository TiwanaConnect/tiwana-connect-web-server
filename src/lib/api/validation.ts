import type { z } from "zod";

import { API_ERROR_CODES, AppError } from "./errors";

export function parseOrThrow<TSchema extends z.ZodTypeAny>(
  schema: TSchema,
  data: unknown
): z.infer<TSchema> {
  const parsed = schema.safeParse(data);

  if (!parsed.success) {
    throw new AppError(
      API_ERROR_CODES.VALIDATION_ERROR,
      "Validation failed.",
      400,
      parsed.error.flatten()
    );
  }

  return parsed.data;
}
