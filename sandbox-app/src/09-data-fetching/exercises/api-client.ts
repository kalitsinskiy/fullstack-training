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
//
// Test your API client by importing it in a React component.

// ---- TODO 1: Create ApiError class ----
// - Extends Error
// - Has `status: number` property
// - Has optional `details: Record<string, string[]>` for validation errors
// - Sets name to 'ApiError'
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly details?: Record<string, string[]>
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
    this.baseUrl =
      baseUrl ??
      ((typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) ||
        'http://localhost:3001');
  }

  addRequestInterceptor(interceptor: RequestInterceptor): void {
    this.requestInterceptors.push(interceptor);
  }

  addResponseInterceptor(interceptor: ResponseInterceptor): void {
    this.responseInterceptors.push(interceptor);
  }

  // TODO: private getAuthHeaders(): Record<string, string>
  // - Read token from localStorage
  // - Return Authorization header if token exists, empty object otherwise
  private getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem('token');

    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  // TODO: private async request<T>(endpoint: string, options?: RequestInit): Promise<T>
  // - Build full URL: baseUrl + endpoint
  // - Merge headers: Content-Type: application/json + auth headers + custom headers
  // - Run all request interceptors on the options
  // - Call fetch
  // - Run all response interceptors on the response
  // - Handle 401: clear localStorage token, redirect to /login, throw ApiError
  // - Handle non-OK: parse error body, throw ApiError with status and message
  // - Handle 204: return undefined as T
  // - Parse and return JSON
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    let config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
        ...options.headers,
      },
    };

    for (const interceptor of this.requestInterceptors) {
      config = interceptor(url, config);
    }

    let response = await fetch(url, config);

    for (const interceptor of this.responseInterceptors) {
      response = interceptor(response);
    }

    if (response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';

      throw new ApiError(401, 'Session expired. Please log in again');
    }

    if (!response.ok) {
      let message = response.statusText;
      let details: Record<string, string[]> | undefined;

      try {
        const body = await response.json();
        message = body.message ?? message;
        details = body.errors;
      } catch {
        // body wasn't JSON — use statusText
      }

      throw new ApiError(response.status, message, details);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return response.json() as Promise<T>;
  }

  // TODO: Convenience methods
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
// - Accept unknown error
// - If ApiError: map status codes to user-friendly messages
//     400 → 'Invalid input. Please check your data.'
//     401 → 'Session expired. Please log in again.'
//     403 → 'You do not have permission to do this.'
//     404 → 'The requested resource was not found.'
//     409 → 'This item already exists.'
//     429 → 'Too many requests. Please wait and try again.'
//     500+ → 'Server error. Please try again later.'
//     default → error.message
// - If TypeError with 'Failed to fetch' → 'Network error. Check your connection.'
// - Otherwise → 'An unexpected error occurred.'
export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    switch (error.status) {
      case 400:
        return 'Invalid input. Please check your data.';
      case 401:
        return 'Session expired. Please log in again.';
      case 403:
        return 'You do not have permission to do this.';
      case 404:
        return 'The requested resource was not found.';
      case 409:
        return 'This item already exists.';
      case 429:
        return 'Too many requests. Please wait and try again.';
      default:
        if (error.status >= 500) return 'Server error. Please try again later.';
        return error.message;
    }
  }

  if (error instanceof TypeError && error.message === 'Failed to fetch') {
    return 'Network error. Check your connection.';
  }

  return 'An unexpected error occured.';
}

// ---- TODO 5: Create and export a default instance ----
export const api = new ApiClient();

// ---- TODO 6 (bonus): Add a request interceptor that logs all requests ----
api.addRequestInterceptor((url, options) => {
  console.log(`[API] ${options.method || 'GET'} ${url}`);
  return options;
});
