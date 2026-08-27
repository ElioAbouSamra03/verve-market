/**
 * Thin fetch wrapper for the browser. Every API route responds with the
 * envelope `{ success, data }` or `{ success: false, error }` (see
 * lib/utils/apiResponse.ts) — this unwraps that consistently and throws a
 * plain Error with the server's message so callers can show it directly.
 */

interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string; details?: unknown };
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });

  // 204 No Content has no body to parse.
  if (res.status === 204) return undefined as T;

  const body: ApiEnvelope<T> = await res.json();
  if (!res.ok || !body.success) {
    throw new Error(body.error?.message ?? "Something went wrong. Please try again.");
  }
  return body.data as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path, { method: "GET" }),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body: body ? JSON.stringify(body) : undefined }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PATCH", body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};
