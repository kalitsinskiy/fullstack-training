import axios, { AxiosError } from 'axios';

const TOKEN_KEY = 'santa.accessToken';

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

/**
 * Builds an axios instance for one of our backends.
 * - Attaches the JWT bearer token on every request.
 * - On 401, clears the token and bounces to /login (handled by AuthGuard
 *   once the store is empty).
 */
function createClient(baseURL: string | undefined) {
  const client = axios.create({
    baseURL,
    headers: { 'Content-Type': 'application/json' },
  });

  client.interceptors.request.use((config) => {
    const token = tokenStore.get();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  client.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
      if (error.response?.status === 401) {
        tokenStore.clear();
        // Hard-redirect avoids a stale auth state lingering in memory.
        if (window.location.pathname !== '/login') {
          window.location.assign('/login');
        }
      }
      return Promise.reject(error);
    },
  );

  return client;
}

export const api = createClient(import.meta.env.VITE_API_URL);

export const notificationsApi = createClient(
  import.meta.env.VITE_NOTIFICATIONS_URL,
);

/**
 * Narrow an unknown error into a user-facing message.
 *
 * The two backends disagree on error envelope shape:
 * - santa-api: `{ success, statusCode, message, timestamp }`
 * - santa-notifications: `{ success: false, error: { code, message } }`
 */
export function getApiErrorMessage(error: unknown, fallback = 'Something went wrong'): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as
      | { message?: string | string[]; error?: { message?: string } }
      | undefined;
    const message = data?.message ?? data?.error?.message;
    if (Array.isArray(message)) return message.join(', ');
    if (message) return message;
  }
  return fallback;
}
