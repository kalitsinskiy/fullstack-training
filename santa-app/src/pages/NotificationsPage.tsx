import { Bell } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { api, getApiErrorMessage } from '@/lib/api';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/EmptyState';
import { Button } from '@/components/ui/button';
import type { Notification, NotificationsResponse } from '@/types/api';

const PAGE_LIMIT = 20;

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString();
}

function NotificationItem({
  notification,
  onMarkRead,
}: {
  notification: Notification;
  onMarkRead: (id: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => !notification.read && onMarkRead(notification.id)}
      className={cn(
        'flex w-full items-start gap-3 rounded-lg border border-border px-4 py-3 text-left transition-colors',
        notification.read
          ? 'bg-card text-foreground'
          : 'bg-primary-soft/40 hover:bg-primary-soft/60 cursor-pointer',
      )}
    >
      <Bell
        className={cn(
          'mt-0.5 size-4 shrink-0',
          notification.read ? 'text-muted-foreground' : 'text-primary',
        )}
      />
      <div className="min-w-0 flex-1">
        <p className={cn('text-[15px]', !notification.read && 'font-medium')}>
          {notification.message}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {notification.type} · {formatDate(notification.createdAt)}
        </p>
      </div>
      {!notification.read && (
        <span className="ml-2 shrink-0 rounded-full bg-primary px-2.5 py-0.5 text-xs font-semibold text-primary-foreground">
          New
        </span>
      )}
    </button>
  );
}

export function NotificationsPage() {
  const queryClient = useQueryClient();

  const { data, isLoading, isError, error } = useQuery<NotificationsResponse>({
    queryKey: ['notifications'],
    queryFn: async () => {
      const { data } = await api.get<NotificationsResponse>(
        `/api/notifications?page=1&limit=${PAGE_LIMIT}`,
      );
      return data;
    },
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/api/notifications/${id}/read`),
    onSuccess: (_, id) => {
      queryClient.setQueryData<NotificationsResponse>(
        ['notifications'],
        (prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            unreadCount: Math.max(0, prev.unreadCount - 1),
            data: prev.data.map((n) =>
              n.id === id ? { ...n, read: true } : n,
            ),
          };
        },
      );
    },
    onError: (err) =>
      toast.error(getApiErrorMessage(err, 'Could not mark as read')),
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => api.patch('/api/notifications/read-all'),
    onSuccess: () => {
      queryClient.setQueryData<NotificationsResponse>(
        ['notifications'],
        (prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            unreadCount: 0,
            data: prev.data.map((n) => ({ ...n, read: true })),
          };
        },
      );
      toast.success('All notifications marked as read');
    },
    onError: (err) =>
      toast.error(getApiErrorMessage(err, 'Could not mark all as read')),
  });

  const notifications = data?.data ?? [];
  const unreadCount = data?.unreadCount ?? 0;

  if (isLoading) {
    return (
      <>
        <PageHeader
          title="Notifications"
          description="Room events via RabbitMQ. Click an unread item to mark it read."
        />
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      </>
    );
  }

  if (isError) {
    return (
      <>
        <PageHeader title="Notifications" />
        <p className="text-sm text-destructive">
          {getApiErrorMessage(error, 'Failed to load notifications')}
        </p>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Notifications"
        description="Room events via RabbitMQ. Click an unread item to mark it read."
        action={
          unreadCount > 0 ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => markAllReadMutation.mutate()}
              disabled={markAllReadMutation.isPending}
            >
              Mark all read
            </Button>
          ) : undefined
        }
      />

      {notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="You're all caught up"
          description="Notifications about draws, joins, and messages will show up here."
        />
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <NotificationItem
              key={n.id}
              notification={n}
              onMarkRead={(id) => markReadMutation.mutate(id)}
            />
          ))}
        </div>
      )}
    </>
  );
}
