import axios, { AxiosError } from 'axios';
import { tokenStore } from './api';

export const notificationsApi = axios.create({
  baseURL: import.meta.env.VITE_WS_URL || undefined,
  headers: { 'Content-Type': 'application/json' },
});

notificationsApi.interceptors.request.use((config) => {
  const token = tokenStore.get();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

notificationsApi.interceptors.response.use(
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
