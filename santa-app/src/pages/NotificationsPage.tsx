import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/EmptyState';
import { Card, CardContent } from '@/components/ui/card';
import { notifApi, type NotificationsResponse } from '@/features/notifications/notifApi';

export function NotificationsPage() {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    refetchInterval: 5000,
    queryFn: async () =>
      (await notifApi.get<NotificationsResponse>('/api/notifications')).data,
  });

  const markRead = useMutation({
    mutationFn: (id: string) => notifApi.patch(`/api/notifications/${id}/read`),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const notifications = data?.data ?? [];

  return (
    <>
      <PageHeader
        title="Notifications"
        description="Room events via RabbitMQ. Click an unread item to mark it read."
      />
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="You're all caught up"
          description="Create or join a room — events show up here as notifications."
        />
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <Card
              key={n.id}
              className={`${n.read ? 'opacity-60' : 'cursor-pointer'}`}
              onClick={() => {
                if (!n.read) markRead.mutate(n.id);
              }}
            >
              <CardContent className="flex items-center justify-between gap-3 py-3">
                <div className="flex items-center gap-3">
                  <Bell className="size-4 text-primary" />
                  <div>
                    <p className="text-sm">{n.message}</p>
                    <p className="text-xs text-muted-foreground">
                      {n.type} · {new Date(n.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                {!n.read && (
                  <span className="rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                    New
                  </span>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
