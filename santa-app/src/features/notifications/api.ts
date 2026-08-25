import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '@/lib/api';
import type { Notification, NotificationList } from '@/types/api';

export const NOTIFICATIONS_PAGE_SIZE = 20;

export const notificationKeys = {
  all: () => ['notifications'] as const,
  list: (page: number) => ['notifications', { page }] as const,
  unreadCount: () => ['notifications', 'unreadCount'] as const,
};

export function useNotifications(page = 1, limit = NOTIFICATIONS_PAGE_SIZE) {
  return useQuery({
    queryKey: notificationKeys.list(page),
    queryFn: async () => {
      const { data } = await notificationsApi.get<NotificationList>(
        '/api/notifications',
        { params: { page, limit } },
      );
      return data;
    },
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: notificationKeys.unreadCount(),
    queryFn: async () => {
      const { data } = await notificationsApi.get<NotificationList>(
        '/api/notifications',
        { params: { page: 1, limit: 1 } },
      );
      return data.unreadCount;
    },
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await notificationsApi.patch<Notification>(
        `/api/notifications/${id}/read`,
      );
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: notificationKeys.all() });
    },
  });
}
