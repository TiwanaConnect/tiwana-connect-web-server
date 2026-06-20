"use client";

type ApiResponse<T> = {
  data: T | null;
  error: { message: string } | null;
};

export async function apiRequest<T>(path: string, init?: RequestInit) {
  const response = await fetch(path, {
    ...init,
    headers: {
      ...(init?.body ? { "content-type": "application/json" } : {}),
      ...init?.headers
    }
  });
  const json = (await response.json()) as ApiResponse<T>;

  if (!response.ok || json.error) {
    throw new Error(json.error?.message ?? "Request failed.");
  }

  return json.data as T;
}
