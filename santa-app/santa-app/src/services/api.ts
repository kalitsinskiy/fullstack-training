export class ApiError extends Error {
  readonly status: number;
  readonly details?: Record<string, string[]>;

  constructor(status: number, message: string, details?: Record<string, string[]>) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

type RequestInterceptor = (url: string, options: RequestInit) => RequestInit;

class ApiClient {
  private baseUrl: string;
  private requestInterceptors: RequestInterceptor[] = [];
  private unauthorizedHandler: (() => void) | null = null;

  constructor() {
    this.baseUrl =
      import.meta.env.VITE_API_URL ?? 'http://localhost:3001';
  }

  setUnauthorizedHandler(fn: () => void) {
    this.unauthorizedHandler = fn;
  }

  addRequestInterceptor(interceptor: RequestInterceptor) {
    this.requestInterceptors.push(interceptor);
  }

  private getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const hasBody = options.body !== undefined;
    let merged: RequestInit = {
      ...options,
      headers: {
        ...(hasBody ? { 'Content-Type': 'application/json' } : {}),
        ...this.getAuthHeaders(),
        ...(options.headers ?? {}),
      },
    };

    for (const interceptor of this.requestInterceptors) {
      merged = interceptor(url, merged);
    }

    const response = await fetch(url, merged);

    if (response.status === 401) {
      localStorage.removeItem('token');
      this.unauthorizedHandler?.();
      throw new ApiError(401, 'Session expired. Please log in again.');
    }

    if (!response.ok) {
      let message = response.statusText;
      let details: Record<string, string[]> | undefined;
      try {
        const body = await response.json();
        message = body.message || message;
        details = body.errors;
      } catch {
        /* not JSON */
      }
      throw new ApiError(response.status, message, details);
    }

    if (response.status === 204) return undefined as T;
    return response.json() as Promise<T>;
  }

  get<T>(url: string): Promise<T> {
    return this.request<T>(url, { method: 'GET' });
  }

  post<T>(url: string, body?: unknown): Promise<T> {
    return this.request<T>(url, {
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  put<T>(url: string, body?: unknown): Promise<T> {
    return this.request<T>(url, {
      method: 'PUT',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  patch<T>(url: string, body?: unknown): Promise<T> {
    return this.request<T>(url, {
      method: 'PATCH',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  delete<T>(url: string): Promise<T> {
    return this.request<T>(url, { method: 'DELETE' });
  }
}

export const api = new ApiClient();

export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 400) return 'Invalid input. Please check your data.';
    if (error.status === 401) return 'Session expired. Please log in again.';
    if (error.status === 403) return 'You do not have permission to do this.';
    if (error.status === 404) return 'The requested resource was not found.';
    if (error.status === 409) return 'This item already exists.';
    if (error.status === 429) return 'Too many requests. Please wait and try again.';
    if (error.status >= 500) return 'Server error. Please try again later.';
    return error.message;
  }
  if (error instanceof TypeError && error.message === 'Failed to fetch') {
    return 'Network error. Check your connection.';
  }
  return 'An unexpected error occurred.';
}
