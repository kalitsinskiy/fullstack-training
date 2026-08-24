import axios, { AxiosError } from 'axios';

const TOKEN_KEY = 'santa.accessToken';

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

function addInterceptors(instance: ReturnType<typeof axios.create>) {
  instance.interceptors.request.use((config) => {
    const token = tokenStore.get();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  instance.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
      if (error.response?.status === 401) {
        tokenStore.clear();
        if (window.location.pathname !== '/login') {
          window.location.assign('/login');
        }
      }
      return Promise.reject(error);
    },
  );

  return instance;
}

/** HTTP client for santa-api (auth, rooms, users). */
export const api = addInterceptors(
  axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    headers: { 'Content-Type': 'application/json' },
  }),
);

/** HTTP client for santa-notifications (notifications, messages). */
export const notificationsApi = addInterceptors(
  axios.create({
    baseURL: import.meta.env.VITE_WS_URL,
    headers: { 'Content-Type': 'application/json' },
  }),
);

/** Narrow an unknown error into a user-facing message. */
export function getApiErrorMessage(error: unknown, fallback = 'Something went wrong'): string {
  if (axios.isAxiosError(error)) {
    const msg = (error.response?.data as { error?: { message?: string | string[] } } | undefined)
      ?.error?.message;
    if (Array.isArray(msg)) return msg.join(', ');
    if (msg) return msg;
  }
  return fallback;
}
