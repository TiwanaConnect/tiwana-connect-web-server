export type ApiError = {
  code: string;
  message: string;
  details?: unknown;
};

export type ApiResponse<T> =
  | {
      data: T;
      error: null;
    }
  | {
      data: null;
      error: ApiError;
    };
