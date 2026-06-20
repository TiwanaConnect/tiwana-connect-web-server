export const API_ERROR_CODES = {
  VALIDATION_ERROR: "VALIDATION_ERROR",
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  CONFLICT: "CONFLICT",
  ACCOUNT_INACTIVE: "ACCOUNT_INACTIVE",
  ACCOUNT_BLOCKED: "ACCOUNT_BLOCKED",
  TOKEN_EXPIRED: "TOKEN_EXPIRED",
  RESULT_NOT_PUBLISHED: "RESULT_NOT_PUBLISHED",
  TREE_TOO_LARGE: "TREE_TOO_LARGE",
  PUSH_TOKEN_INVALID: "PUSH_TOKEN_INVALID",
  INTERNAL_ERROR: "INTERNAL_ERROR"
} as const;

export type ApiErrorCode =
  (typeof API_ERROR_CODES)[keyof typeof API_ERROR_CODES];

export class AppError extends Error {
  constructor(
    public readonly code: ApiErrorCode,
    message: string,
    public readonly status = 400,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = "AppError";
  }
}
