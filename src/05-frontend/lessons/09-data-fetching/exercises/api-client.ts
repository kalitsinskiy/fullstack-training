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

export {};

// ---- TODO 1: Create ApiError class ----
// - Extends Error
// - Has `status: number` property
// - Has optional `details: Record<string, string[]>` for validation errors
// - Sets name to 'ApiError'

// ---- TODO 2: Define interceptor types ----
// type RequestInterceptor = (url: string, options: RequestInit) => RequestInit;
// type ResponseInterceptor = (response: Response) => Response;

// ---- TODO 3: Create the ApiClient class ----
//
// class ApiClient {
//   private baseUrl: string;
//   private requestInterceptors: RequestInterceptor[];
//   private responseInterceptors: ResponseInterceptor[];
//
//   constructor(baseUrl?: string) {
//     // TODO: Set baseUrl from parameter, or from import.meta.env.VITE_API_URL,
//     // or fallback to 'http://localhost:3001'
//     // Initialize empty interceptor arrays
//   }
//
//   // TODO: addRequestInterceptor(interceptor: RequestInterceptor): void
//   // TODO: addResponseInterceptor(interceptor: ResponseInterceptor): void
//
//   // TODO: private getAuthHeaders(): Record<string, string>
//   // - Read token from localStorage
//   // - Return Authorization header if token exists, empty object otherwise
//
//   // TODO: private async request<T>(endpoint: string, options?: RequestInit): Promise<T>
//   // - Build full URL: baseUrl + endpoint
//   // - Merge headers: Content-Type: application/json + auth headers + custom headers
//   // - Run all request interceptors on the options
//   // - Call fetch
//   // - Run all response interceptors on the response
//   // - Handle 401: clear localStorage token, redirect to /login, throw ApiError
//   // - Handle non-OK: parse error body, throw ApiError with status and message
//   // - Handle 204: return undefined as T
//   // - Parse and return JSON
//
//   // TODO: Convenience methods
//   // get<T>(url: string): Promise<T>
//   // post<T>(url: string, body?: unknown): Promise<T>
//   // put<T>(url: string, body?: unknown): Promise<T>
//   // patch<T>(url: string, body?: unknown): Promise<T>
//   // delete<T>(url: string): Promise<T>
// }

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

// ---- TODO 5: Create and export a default instance ----
// export const api = new ApiClient();

// ---- TODO 6 (bonus): Add a request interceptor that logs all requests ----
// api.addRequestInterceptor((url, options) => {
//   console.log(`[API] ${options.method || 'GET'} ${url}`);
//   return options;
// });
