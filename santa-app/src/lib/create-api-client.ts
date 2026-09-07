import axios, { type AxiosError, type AxiosInstance } from 'axios';
import { tokenStore } from './token-store';

export function createApiClient(baseURL: string | undefined): AxiosInstance {
  const client = axios.create({
    baseURL: baseURL || undefined,
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

        if (window.location.pathname !== '/login') {
          window.location.assign('/login');
        }
      }

      return Promise.reject(error);
    },
  );

  return client;
}
