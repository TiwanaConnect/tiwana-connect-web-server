import { NextResponse } from "next/server";

import type { ApiErrorCode } from "./errors";

export type ApiSuccessBody<T> = {
  data: T;
  error: null;
};

export type ApiErrorBody = {
  data: null;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

export function apiSuccess<T>(data: T, init?: ResponseInit) {
  return NextResponse.json<ApiSuccessBody<T>>({ data, error: null }, init);
}

export function apiError(
  code: ApiErrorCode | string,
  message: string,
  status = 400,
  details?: unknown
) {
  return NextResponse.json<ApiErrorBody>(
    {
      data: null,
      error: {
        code,
        message,
        ...(details === undefined ? {} : { details })
      }
    },
    { status }
  );
}
