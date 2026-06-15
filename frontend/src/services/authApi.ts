const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

const TIMEOUT = 10000; // 10s max wait

function fetchWithTimeout(url: string, options: RequestInit = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT);

  return fetch(url, {
    ...options,
    signal: controller.signal,
  }).finally(() => clearTimeout(timeout));
}

async function safeJson(response: Response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

export async function register(data: {
  name: string;
  email: string;
  password: string;
}) {
  const response = await fetchWithTimeout(`${API_BASE_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  const result = await safeJson(response);

  if (!response.ok) {
    throw new Error(result?.message || "Registration failed");
  }

  return result as {
    user: { id: string; email: string; name: string; role: string };
    token: string;
  };
}

export async function login(data: { email: string; password: string }) {
  const response = await fetchWithTimeout(`${API_BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  const result = await safeJson(response);

  if (!response.ok) {
    throw new Error(result?.message || "Login failed");
  }

  return result as {
    user: { id: string; email: string; name: string; role: string };
    token: string;
  };
}
