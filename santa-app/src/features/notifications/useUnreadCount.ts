import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { NotificationsResponse } from '@/types/api';

export function useUnreadCount() {
  const { data } = useQuery<NotificationsResponse>({
    queryKey: ['notifications', 'unread-count'],
    queryFn: async () => {
      const { data } = await api.get<NotificationsResponse>(
        '/api/notifications?page=1&limit=1',
      );
      return data;
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  return data?.unreadCount ?? 0;
}
