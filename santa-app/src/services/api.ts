const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

export class ApiError extends Error {
  name = 'ApiError';
  status: number;
  details?: unknown;
  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('token');

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (res.status === 401) {
    // Only redirect when a token exists — that's a real session expiry.
    // A 401 without a token is a failed login attempt; just throw so the
    // form can display the error without triggering a full page reload.
    const hadToken = !!localStorage.getItem('token');
    localStorage.removeItem('token');
    if (hadToken) window.location.href = '/login';
    throw new ApiError(401, 'Invalid credentials');
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: res.statusText }));
    throw new ApiError(res.status, body.message ?? 'Request failed', body);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  get:    <T>(url: string, options?: RequestInit) =>
    request<T>(url, options),
  post:   <T>(url: string, body?: unknown, options?: RequestInit) =>
    request<T>(url, { ...options, method: 'POST',   body: body != null ? JSON.stringify(body) : undefined }),
  patch:  <T>(url: string, body?: unknown, options?: RequestInit) =>
    request<T>(url, { ...options, method: 'PATCH',  body: body != null ? JSON.stringify(body) : undefined }),
  put:    <T>(url: string, body?: unknown, options?: RequestInit) =>
    request<T>(url, { ...options, method: 'PUT',    body: body != null ? JSON.stringify(body) : undefined }),
  delete: <T>(url: string, options?: RequestInit) =>
    request<T>(url, { ...options, method: 'DELETE' }),
};
