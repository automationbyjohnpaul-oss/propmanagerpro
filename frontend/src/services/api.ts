import { getToken, removeToken } from "@/lib/auth";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

// Request deduplication map - prevents duplicate in-flight GET requests
const inFlightRequests = new Map<string, Promise<unknown>>();

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
  signal?: AbortSignal,
): Promise<T> {
  const token = getToken();
  const url = `${API_BASE_URL}${endpoint}`;
  const method = options.method || "GET";

  const config: RequestInit = {
    ...options,
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    signal,
  };

  // ============================================
  // GET REQUESTS
  // ============================================

  if (method === "GET") {
    // Deduplicate identical in-flight GET requests
    if (inFlightRequests.has(url)) {
      return inFlightRequests.get(url) as Promise<T>;
    }

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
            data &&
            typeof data === "object" &&
            "message" in data &&
            typeof (data as { message?: unknown }).message === "string"
              ? (data as { message: string }).message
              : `Request failed with status ${res.status}`;

          throw new Error(message);
        }

        return data as T;
      })
      .finally(() => {
        inFlightRequests.delete(url);
      });

    inFlightRequests.set(url, fetchPromise);

    return fetchPromise;
  }

  // ============================================
  // NON-GET REQUESTS
  // ============================================

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
      data &&
      typeof data === "object" &&
      "message" in data &&
      typeof (data as { message?: unknown }).message === "string"
        ? (data as { message: string }).message
        : `Request failed with status ${response.status}`;

    throw new Error(message);
  }

  return data as T;
}

// ============================================
// PUBLIC API CLIENT
// ============================================

export const api = {
  get: <T>(endpoint: string, signal?: AbortSignal) =>
    request<T>(endpoint, {}, signal),

  post: <T>(endpoint: string, body: unknown, signal?: AbortSignal) =>
    request<T>(
      endpoint,
      {
        method: "POST",
        body: JSON.stringify(body),
      },
      signal,
    ),

  put: <T>(endpoint: string, body: unknown, signal?: AbortSignal) =>
    request<T>(
      endpoint,
      {
        method: "PUT",
        body: JSON.stringify(body),
      },
      signal,
    ),

  patch: <T>(endpoint: string, body: unknown, signal?: AbortSignal) =>
    request<T>(
      endpoint,
      {
        method: "PATCH",
        body: JSON.stringify(body),
      },
      signal,
    ),

  delete: <T>(endpoint: string, signal?: AbortSignal) =>
    request<T>(
      endpoint,
      {
        method: "DELETE",
      },
      signal,
    ),
};
