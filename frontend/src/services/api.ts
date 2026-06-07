import { getToken, removeToken } from "@/lib/auth";
import { getCached, setCache, invalidateCacheByPrefix } from "@/lib/cache";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();
  const url = `${API_BASE_URL}${endpoint}`;
  const method = options.method || "GET";

  // Return cached data for GET requests
  if (method === "GET") {
    const cached = getCached<T>(url);
    if (cached) return cached;
  }

  const config: RequestInit = {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    ...options,
    method,
  };

  const response = await fetch(url, config);

  if (response.status === 401) {
    removeToken();
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
    throw new Error("Session expired. Please login again.");
  }

  if (response.status === 204) {
    return undefined as T;
  }

  let data: unknown;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const message =
      (data && typeof data === "object" && "message" in data
        ? (data as { message: string }).message
        : undefined) ?? `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  // Cache successful GET responses
  if (method === "GET") {
    setCache(url, data);
  }

  // Invalidate related caches on mutations
  if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
    invalidateCacheByPrefix("/api/properties");
    invalidateCacheByPrefix("/api/tenants");
    invalidateCacheByPrefix("/api/leases");
    invalidateCacheByPrefix("/api/payments");
    invalidateCacheByPrefix("/api/finance");
  }

  return data as T;
}

export const api = {
  get: <T>(endpoint: string) => request<T>(endpoint),
  post: <T>(endpoint: string, body: unknown) =>
    request<T>(endpoint, { method: "POST", body: JSON.stringify(body) }),
  put: <T>(endpoint: string, body: unknown) =>
    request<T>(endpoint, { method: "PUT", body: JSON.stringify(body) }),
  patch: <T>(endpoint: string, body: unknown) =>
    request<T>(endpoint, { method: "PATCH", body: JSON.stringify(body) }),
  delete: <T>(endpoint: string) => request<T>(endpoint, { method: "DELETE" }),
};
