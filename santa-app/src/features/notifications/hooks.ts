import { notificationsApi } from '@/lib/notificationsApi';
import type { Notification, NotificationList } from '@/types/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

const notificationsKey = ['notifications'] as const;

export function useNotifications(page = 1, limit = 20) {
  return useQuery({
    queryKey: [...notificationsKey, page, limit],
    queryFn: async () =>
      (
        await notificationsApi.get<NotificationList>(
          `/api/notifications?page=${page}&limit=${limit}`,
        )
      ).data,
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: [...notificationsKey, 'unread'],
    queryFn: async () =>
      (
        await notificationsApi.get<NotificationList>(
          '/api/notifications?limit=1',
        )
      ).data.unreadCount,
    refetchInterval: 30_000,
  });
}

export function useMarkRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) =>
      (
        await notificationsApi.patch<Notification>(
          `/api/notifications/${id}/read`,
        )
      ).data,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: notificationsKey }),
  });
}
