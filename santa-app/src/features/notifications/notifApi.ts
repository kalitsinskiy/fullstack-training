import axios from 'axios';
import { tokenStore } from '@/lib/api';
import type { Notification } from '@/types/api';

export interface NotificationsResponse {
  data: Notification[];
  unreadCount: number;
}

// santa-notifications runs on a different origin (VITE_WS_URL) and now requires
// the same JWT santa-api issues, so we attach the bearer token here too.
export const notifApi = axios.create({
  baseURL: import.meta.env.VITE_WS_URL,
});

notifApi.interceptors.request.use((config) => {
  const token = tokenStore.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
