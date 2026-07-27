import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '@/lib/api';
import type { Notification } from '@/types/api';

export const notificationKeys = {
  all: () => ['notifications'] as const,
};

export function useNotifications() {
  return useQuery({
    queryKey: notificationKeys.all(),
    queryFn: async () => {
      const { data } =
        await notificationsApi.get<Notification[]>('/api/notifications');
      return data;
    },
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
