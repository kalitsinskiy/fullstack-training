// ============================================
// Exercise: API Client
// ============================================
//
// Build a full-featured API client with:
// 1. Base URL from environment variable (VITE_API_URL) with fallback
// 2. Automatic JWT header injection from localStorage
// 3. Typed response parsing (generic return type)
// 4. Custom ApiError class with status code
// 5. Error transformation — convert API errors to user-friendly messages
// 6. Request interceptor pattern — run a function before every request
// 7. Response interceptor pattern — run a function after every response
// 8. 401 handling — clear token and redirect to /login

// ---- TODO 1: Create ApiError class ----

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly details?: Record<string, string[]>,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// ---- TODO 2: Define interceptor types ----

type RequestInterceptor = (url: string, options: RequestInit) => RequestInit;
type ResponseInterceptor = (response: Response) => Response;

// ---- TODO 3: Create the ApiClient class ----

class ApiClient {
  private baseUrl: string;
  private requestInterceptors: RequestInterceptor[];
  private responseInterceptors: ResponseInterceptor[];

  constructor(baseUrl?: string) {
    // Vite replaces import.meta.env.VITE_API_URL at build time;
    // process.env covers Node/test contexts
    const envUrl = typeof process !== 'undefined' ? process.env['VITE_API_URL'] : undefined;
    this.baseUrl = baseUrl ?? envUrl ?? 'http://localhost:3001';
    this.requestInterceptors = [];
    this.responseInterceptors = [];
  }

  addRequestInterceptor(interceptor: RequestInterceptor): void {
    this.requestInterceptors.push(interceptor);
  }

  addResponseInterceptor(interceptor: ResponseInterceptor): void {
    this.responseInterceptors.push(interceptor);
  }

  private getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    let mergedOptions: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
        ...(options.headers as Record<string, string> | undefined),
      },
    };

    // Run all request interceptors in order
    for (const interceptor of this.requestInterceptors) {
      mergedOptions = interceptor(url, mergedOptions);
    }

    let response = await fetch(url, mergedOptions);

    // Run all response interceptors in order
    for (const interceptor of this.responseInterceptors) {
      response = interceptor(response);
    }

    if (response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
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
        // body wasn't JSON — keep statusText
      }
      throw new ApiError(response.status, message, details);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return response.json() as Promise<T>;
  }

  get<T>(url: string): Promise<T> {
    return this.request<T>(url);
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

// ---- TODO 4: Create getErrorMessage helper function ----

export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    switch (true) {
      case error.status === 400: return 'Invalid input. Please check your data.';
      case error.status === 401: return 'Session expired. Please log in again.';
      case error.status === 403: return 'You do not have permission to do this.';
      case error.status === 404: return 'The requested resource was not found.';
      case error.status === 409: return 'This item already exists.';
      case error.status === 429: return 'Too many requests. Please wait and try again.';
      case error.status >= 500:  return 'Server error. Please try again later.';
      default:                   return error.message;
    }
  }

  if (error instanceof TypeError && error.message === 'Failed to fetch') {
    return 'Network error. Check your connection.';
  }

  return 'An unexpected error occurred.';
}

// ---- TODO 5: Create and export a default instance ----

export const api = new ApiClient();

// ---- TODO 6 (bonus): Add a request interceptor that logs all requests ----

api.addRequestInterceptor((url, options) => {
  console.log(`[API] ${options.method || 'GET'} ${url}`);
  return options;
});
