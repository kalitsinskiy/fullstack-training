// ============================================
// Exercise: API Client
// ============================================

// ---- TODO 1: ApiError class ----

export class ApiError extends Error {
  name = 'ApiError';
  constructor(
    public readonly status: number,
    message: string,
    public readonly details?: Record<string, string[]>,
  ) {
    super(message);
  }
}

// ---- TODO 2: Interceptor types ----

type RequestInterceptor = (url: string, options: RequestInit) => RequestInit;
type ResponseInterceptor = (response: Response) => Response;

// ---- TODO 3: ApiClient class ----

class ApiClient {
  private baseUrl: string;
  private requestInterceptors: RequestInterceptor[] = [];
  private responseInterceptors: ResponseInterceptor[] = [];

  constructor(baseUrl?: string) {
    this.baseUrl =
      baseUrl ??
      (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) ??
      'http://localhost:3001';
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
        ...options.headers,
      },
    };

    // Run request interceptors
    for (const interceptor of this.requestInterceptors) {
      mergedOptions = interceptor(url, mergedOptions);
    }

    let response = await fetch(url, mergedOptions);

    // Run response interceptors
    for (const interceptor of this.responseInterceptors) {
      response = interceptor(response);
    }

    // 401 — session expired
    if (response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
      throw new ApiError(401, 'Session expired. Please log in again.');
    }

    // Non-OK responses
    if (!response.ok) {
      let message = response.statusText;
      let details: Record<string, string[]> | undefined;
      try {
        const body = await response.json();
        message = body.message ?? message;
        details = body.errors;
      } catch {
        // body wasn't JSON
      }
      throw new ApiError(response.status, message, details);
    }

    // 204 No Content
    if (response.status === 204) return undefined as T;

    return response.json() as Promise<T>;
  }

  get<T>(url: string, options?: RequestInit): Promise<T> {
    return this.request<T>(url, options);
  }

  post<T>(url: string, body?: unknown, options?: RequestInit): Promise<T> {
    return this.request<T>(url, {
      ...options,
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  put<T>(url: string, body?: unknown, options?: RequestInit): Promise<T> {
    return this.request<T>(url, {
      ...options,
      method: 'PUT',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  patch<T>(url: string, body?: unknown, options?: RequestInit): Promise<T> {
    return this.request<T>(url, {
      ...options,
      method: 'PATCH',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  delete<T>(url: string, options?: RequestInit): Promise<T> {
    return this.request<T>(url, { ...options, method: 'DELETE' });
  }
}

// ---- TODO 4: getErrorMessage helper ----

export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    switch (error.status) {
      case 400: return 'Invalid input. Please check your data.';
      case 401: return 'Session expired. Please log in again.';
      case 403: return 'You do not have permission to do this.';
      case 404: return 'The requested resource was not found.';
      case 409: return 'This item already exists.';
      case 429: return 'Too many requests. Please wait and try again.';
      default:
        if (error.status >= 500) return 'Server error. Please try again later.';
        return error.message;
    }
  }

  if (error instanceof TypeError && error.message === 'Failed to fetch') {
    return 'Network error. Check your connection.';
  }

  return 'An unexpected error occurred.';
}

// ---- TODO 5: Default instance ----

export const api = new ApiClient();

// ---- TODO 6 (bonus): Logging request interceptor ----

api.addRequestInterceptor((url, options) => {
  console.log(`[API] ${options.method ?? 'GET'} ${url}`);
  return options;
});
