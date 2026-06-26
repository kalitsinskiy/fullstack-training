import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Bell } from 'lucide-react';
import { notifApi, type NotificationsResponse } from './notifApi';

// Header bell with an unread badge. Shares the ['notifications'] query cache with
// NotificationsPage, so marking items read updates the badge instantly.
export function NotificationBell() {
  const { data } = useQuery({
    queryKey: ['notifications'],
    refetchInterval: 5000,
    queryFn: async () =>
      (await notifApi.get<NotificationsResponse>('/api/notifications')).data,
  });
  const count = data?.unreadCount ?? 0;

  return (
    <Link
      to="/notifications"
      className="relative inline-flex items-center"
      aria-label={`Notifications${count ? ` (${count} unread)` : ''}`}
    >
      <Bell className="size-5 text-muted-foreground hover:text-foreground" />
      {count > 0 && (
        <span className="absolute -right-2 -top-2 flex min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-medium text-white">
          {count}
        </span>
      )}
    </Link>
  );
}
