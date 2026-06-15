import { getToken, removeToken } from "@/lib/auth";
import { getCache, setCache } from "@/lib/sessionCache";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

// Request deduplication map - prevents duplicate in-flight requests
const inFlightRequests = new Map<string, Promise<any>>();

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
  signal?: AbortSignal,
): Promise<T> {
  const token = getToken();
  const url = `${API_BASE_URL}${endpoint}`;
  const method = options.method || "GET";

  const config: RequestInit = {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    ...options,
    method,
    signal,
  };

  // For GET requests, check cache first, then deduplicate
  if (method === "GET") {
    // CACHE DISABLED (temporary for CP-001 stabilization)
    // 1. Check session cache first
    // const cached = getCache(url);
    // if (cached) return cached as T;

    // 2. Check for in-flight request (deduplication)
    if (inFlightRequests.has(url)) {
      return inFlightRequests.get(url) as Promise<T>;
    }

    // 3. Create new request with deduplication tracking
    const fetchPromise = fetch(url, config)
      .then(async (res) => {
        if (res.status === 401) {
          removeToken();
          if (typeof window !== "undefined") {
            window.location.href = "/login";
          }
          throw new Error("Session expired. Please login again.");
        }

        if (res.status === 204) {
          return undefined as T;
        }

        let data: unknown;
        try {
          data = await res.json();
        } catch {
          data = null;
        }

        if (!res.ok) {
          const message =
            (data && typeof data === "object" && "message" in data
              ? (data as { message: string }).message
              : undefined) ?? `Request failed with status ${res.status}`;
          throw new Error(message);
        }

        // Cache disabled (CP-001 stabilization)
        // setCache(url, data);
        return data as T;
      })
      .finally(() => {
        inFlightRequests.delete(url);
      });

    inFlightRequests.set(url, fetchPromise);
    return fetchPromise;
  }

  // For non-GET requests (mutations)
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

  return data as T;
}

export const api = {
  get: <T>(endpoint: string, signal?: AbortSignal) =>
    request<T>(endpoint, {}, signal),
  post: <T>(endpoint: string, body: unknown, signal?: AbortSignal) =>
    request<T>(
      endpoint,
      { method: "POST", body: JSON.stringify(body) },
      signal,
    ),
  put: <T>(endpoint: string, body: unknown, signal?: AbortSignal) =>
    request<T>(endpoint, { method: "PUT", body: JSON.stringify(body) }, signal),
  patch: <T>(endpoint: string, body: unknown, signal?: AbortSignal) =>
    request<T>(
      endpoint,
      { method: "PATCH", body: JSON.stringify(body) },
      signal,
    ),
  delete: <T>(endpoint: string, signal?: AbortSignal) =>
    request<T>(endpoint, { method: "DELETE" }, signal),
};
