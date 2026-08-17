import { useQuery } from '@tanstack/react-query';
import { notificationsApi } from '@/lib/notificationsApi';
import { tokenStore } from '@/lib/api';

interface UnreadResponse {
  unreadCount: number;
}

export function useUnreadCount() {
  const { data } = useQuery<UnreadResponse>({
    queryKey: ['notifications', 'unread'],
    queryFn: () =>
      notificationsApi
        .get<UnreadResponse>('/api/notifications?limit=1')
        .then((r) => ({ unreadCount: r.data.unreadCount })),
    enabled: !!tokenStore.get(),
    refetchInterval: 30_000,
    staleTime: 20_000,
  });

  return data?.unreadCount ?? 0;
}
