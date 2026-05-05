// ============================================
// API Service Example
// ============================================
// A centralized API service with typed methods, JWT header injection,
// error handling, and convenience methods for GET, POST, PUT, DELETE.
//
// Usage in components:
//   import { api, ApiError } from './api-service';
//   const rooms = await api.get<Room[]>('/rooms');

// ---- Base URL from environment ----

const BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL)
  || 'http://localhost:3001';

// ---- Custom Error Class ----
// Carries the HTTP status code for downstream handling.

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

// ---- Token Management ----
// In a real app, you might use a function from your AuthContext instead.

function getToken(): string | null {
  return localStorage.getItem('token');
}

function clearToken(): void {
  localStorage.removeItem('token');
}

// ---- Core Request Function ----

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  // Merge with any custom headers from options
  if (options.headers) {
    Object.assign(headers, options.headers);
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // Handle 401 — session expired, redirect to login
  if (response.status === 401) {
    clearToken();
    window.location.href = '/login';
    throw new ApiError(401, 'Session expired. Please log in again.');
  }

  // Handle non-OK responses
  if (!response.ok) {
    let message = response.statusText;
    let details: Record<string, string[]> | undefined;

    try {
      const body = await response.json();
      message = body.message || message;
      details = body.errors; // validation errors from NestJS
    } catch {
      // body wasn't JSON — use statusText
    }

    throw new ApiError(response.status, message, details);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

// ---- Convenience Methods ----

// All methods accept an optional `options` second arg so callers can pass
// `signal` for cancellation (used by useFetch / useQuery's queryFn).
export const api = {
  get<T>(url: string, options?: RequestInit): Promise<T> {
    return request<T>(url, options);
  },

  post<T>(url: string, body?: unknown, options?: RequestInit): Promise<T> {
    return request<T>(url, {
      ...options,
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  },

  put<T>(url: string, body?: unknown, options?: RequestInit): Promise<T> {
    return request<T>(url, {
      ...options,
      method: 'PUT',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  },

  patch<T>(url: string, body?: unknown, options?: RequestInit): Promise<T> {
    return request<T>(url, {
      ...options,
      method: 'PATCH',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  },

  delete<T>(url: string, options?: RequestInit): Promise<T> {
    return request<T>(url, { ...options, method: 'DELETE' });
  },
};

// ---- Error Message Helper ----

export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    switch (error.status) {
      case 400: return error.message || 'Invalid input. Please check your data.';
      case 401: return 'Please log in again.';
      case 403: return 'You do not have permission to perform this action.';
      case 404: return 'The requested resource was not found.';
      case 409: return error.message || 'This item already exists.';
      case 422: return error.message || 'Validation failed. Please check your input.';
      case 429: return 'Too many requests. Please wait a moment.';
      case 500: return 'Server error. Please try again later.';
      default: return error.message || 'Something went wrong.';
    }
  }

  if (error instanceof TypeError && error.message === 'Failed to fetch') {
    return 'Network error. Please check your internet connection.';
  }

  return 'An unexpected error occurred. Please try again.';
}

// ---- Usage Examples ----

// These are type-only examples showing how you'd use the API service:
//
// // Fetch rooms
// const rooms = await api.get<Room[]>('/rooms');
//
// // Create room
// const newRoom = await api.post<Room>('/rooms', { name: 'Office Party' });
//
// // Login (matches santa-api contract — camelCase, no nested user)
// interface LoginResponse { accessToken: string }
// const { accessToken } = await api.post<LoginResponse>('/api/auth/login', { email, password });
// localStorage.setItem('token', accessToken);
// // Then fetch the profile separately:
// const me = await api.get<User>('/api/users/me');
//
// // Delete room
// await api.delete<void>(`/rooms/${roomId}`);
//
// // Error handling
// try {
//   await api.post('/rooms', { name: '' });
// } catch (err) {
//   console.error(getErrorMessage(err)); // "Invalid input. Please check your data."
// }
