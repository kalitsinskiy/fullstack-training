import { Bell, MoveRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/EmptyState';
import { useMarkRead, useNotifications } from '@/features/notifications/hooks';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

/**
 * Notifications — room events, draw completed, new messages.
 * TODO(lesson 06): fetch notification list from santa-notifications (HTTP).
 * TODO(lesson 07): live updates over the WebSocket + toast on new arrivals.
 */
export function NotificationsPage() {
  const { data, isLoading, isError } = useNotifications();
  const markRead = useMarkRead();
  const notifications = data?.data ?? [];

  return (
    <>
      <PageHeader
        title="Notifications"
        description={
          data?.unreadCount
            ? `${data.unreadCount} unread`
            : "What's happening in your rooms."
        }
      />

      {isLoading && (
        <div className="space-y2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-lg border border-border bg-muted/40"
            />
          ))}
        </div>
      )}

      {isError && !isLoading && (
        <p className="text-sm text-muted-foreground">
          Couldn't load notifications
        </p>
      )}

      {!isLoading && !isError && notifications.length === 0 && (
        <EmptyState
          icon={Bell}
          title="You're all caught up"
          description="Notifications about draws, joins, and messages will show up here."
        />
      )}

      {notifications.length > 0 && (
        <ul className="space-y-2">
          {notifications.map((n) => (
            <li key={n.id}>
              <Card
                role="button"
                tabIndex={0}
                onClick={() => !n.read && markRead.mutate(n.id)}
                className={cn(
                  'flex items-start gap-3 p-4 transition-colors',
                  n.read
                    ? 'bg-card cursor-default'
                    : 'cursor-pointer bg-primary/5 hover:bg-primary/10',
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    'mt-1.5 size-2 shrink-0 rounded-full',
                    n.read ? 'bg-transparent' : 'bg-primary',
                  )}
                ></span>

                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      'text-sm',
                      n.read ? 'text-muted-foreground' : 'font-medium',
                    )}
                  >
                    {n.message}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(n.createdAt), {
                      addSuffix: true,
                    })}
                  </p>
                  {n.roomId && (
                    <Link
                      to={`/rooms/${n.roomId}`}
                      onClick={(e) => e.stopPropagation()}
                      className="mt-1 inline-block text-xs font-medium text-primary hover:text-foreground transition-colors"
                    >
                      <span className="flex items-center">
                        View room &nbsp;
                        <MoveRight className="size-4" />
                      </span>
                    </Link>
                  )}
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
