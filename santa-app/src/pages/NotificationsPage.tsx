import { Bell } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { notificationsApi } from '@/lib/notificationsApi';
import { getApiErrorMessage } from '@/lib/api';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/EmptyState';
import { cn } from '@/lib/utils';

interface NotificationItem {
  id: string;
  type: string;
  message: string;
  roomId?: string;
  read: boolean;
  createdAt: string;
}

interface NotificationsResponse {
  data: NotificationItem[];
  total: number;
  unreadCount: number;
  page: number;
  limit: number;
}

export function NotificationsPage() {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery<NotificationsResponse>({
    queryKey: ['notifications'],
    queryFn: () =>
      notificationsApi.get<NotificationsResponse>('/api/notifications?limit=50').then((r) => r.data),
  });

  const markRead = useMutation({
    mutationFn: (id: string) =>
      notificationsApi.patch(`/api/notifications/${id}/read`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
    onError: (err) => toast.error(getApiErrorMessage(err, 'Failed to mark as read')),
  });

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const notifications = data?.data ?? [];

  return (
    <>
      <PageHeader
        title="Notifications"
        description="Room events via RabbitMQ. Click an unread item to mark it read."
      />

      {notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="You're all caught up"
          description="Notifications about draws, joins, and messages will show up here."
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {notifications.map((n) => (
            <li
              key={n.id}
              onClick={() => !n.read && markRead.mutate(n.id)}
              className={cn(
                'flex items-start gap-3 rounded-lg border border-border bg-card p-4 transition-colors',
                !n.read && 'cursor-pointer hover:bg-primary/5',
              )}
            >
              <Bell
                className={cn(
                  'mt-0.5 size-4 shrink-0',
                  n.read ? 'text-muted-foreground' : 'text-primary',
                )}
              />
              <div className="min-w-0 flex-1">
                <p
                  className={cn(
                    'text-sm',
                    n.read ? 'text-muted-foreground' : 'font-medium text-foreground',
                  )}
                >
                  {n.message}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {n.type} · {new Date(n.createdAt).toLocaleString()}
                </p>
              </div>
              {!n.read && (
                <span className="shrink-0 rounded-full bg-primary px-2.5 py-0.5 text-xs font-semibold text-primary-foreground">
                  New
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
