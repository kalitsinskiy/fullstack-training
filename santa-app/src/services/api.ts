const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem("token");

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: res.statusText }));
    const message = body.message ?? "Request failed";

    // A 401 on the auth endpoints means "bad credentials", not an expired
    // session — surface the server message and leave any token untouched.
    // A 401 on any other (authenticated) endpoint means the session really
    // expired: clear the token and bounce to /login.
    if (res.status === 401 && !endpoint.startsWith("/auth/") && token) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }

    throw new ApiError(res.status, message, body);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  get: <T>(url: string, options?: RequestInit) => request<T>(url, options),
  post: <T>(url: string, body?: unknown, options?: RequestInit) =>
    request<T>(url, {
      ...options,
      method: "POST",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),
  patch: <T>(url: string, body?: unknown, options?: RequestInit) =>
    request<T>(url, {
      ...options,
      method: "PATCH",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),
  put: <T>(url: string, body?: unknown, options?: RequestInit) =>
    request<T>(url, {
      ...options,
      method: "PUT",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),
  delete: <T>(url: string, options?: RequestInit) =>
    request<T>(url, { ...options, method: "DELETE" }),
};
