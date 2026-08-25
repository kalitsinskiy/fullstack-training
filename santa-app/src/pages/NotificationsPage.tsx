import { useState } from 'react';
import {
  Bell,
  ChevronLeft,
  ChevronRight,
  Gift,
  ListChecks,
  Sparkles,
  UserPlus,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/EmptyState';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  NOTIFICATIONS_PAGE_SIZE,
  useMarkNotificationRead,
  useNotifications,
} from '@/features/notifications/api';
import { getApiErrorMessage } from '@/lib/api';
import type { Notification } from '@/types/api';

const TYPE_ICONS: Record<string, LucideIcon> = {
  'room.created': Gift,
  'user.joined': UserPlus,
  'draw.completed': Sparkles,
  'wishlist.updated': ListChecks,
};

function relativeTime(iso: string): string {
  const seconds = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function NotificationRow({ notification }: { notification: Notification }) {
  const markRead = useMarkNotificationRead();
  const Icon = TYPE_ICONS[notification.type] ?? Bell;
  const unread = !notification.read;

  return (
    <Card
      className={cn(
        'flex flex-row items-start gap-3 p-4 transition-colors',
        unread && 'border-primary/40 bg-primary/5',
      )}
    >
      <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
        <Icon className="size-4 text-primary" />
      </div>

      <div className="min-w-0 flex-1">
        <p className={cn('text-sm break-words', unread && 'font-medium')}>
          {notification.message}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {notification.type} · {relativeTime(notification.createdAt)}
        </p>
      </div>

      {unread && (
        <button
          type="button"
          aria-label={`Mark "${notification.message}" as read`}
          className="shrink-0 rounded-full bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
          disabled={markRead.isPending}
          onClick={() => markRead.mutate(notification.id)}
        >
          New
        </button>
      )}
    </Card>
  );
}

export function NotificationsPage() {
  const [page, setPage] = useState(1);
  const { data, isPending, isError, error, isFetching } = useNotifications(page);

  const notifications = data?.data ?? [];
  const unreadCount = data?.unreadCount ?? 0;
  const hasOlder = notifications.length === NOTIFICATIONS_PAGE_SIZE;
  const showPager = page > 1 || hasOlder;

  return (
    <>
      <PageHeader
        title="Notifications"
        description={
          unreadCount > 0
            ? `${unreadCount} unread. Click an unread item to mark it read.`
            : 'Room events via RabbitMQ.'
        }
      />

      {isPending && (
        <p className="text-sm text-muted-foreground">Loading notifications…</p>
      )}

      {isError && (
        <p className="text-sm text-destructive">
          {getApiErrorMessage(error, 'Could not load notifications')}
        </p>
      )}

      {data && notifications.length === 0 && (
        <EmptyState
          icon={Bell}
          title="You're all caught up"
          description="Notifications about draws, joins, and messages will show up here."
        />
      )}

      {notifications.length > 0 && (
        <ul className="flex flex-col gap-3">
          {notifications.map((notification) => (
            <li key={notification.id}>
              <NotificationRow notification={notification} />
            </li>
          ))}
        </ul>
      )}

      {showPager && (
        <nav
          aria-label="Notification pages"
          className="mt-6 flex items-center justify-center gap-4"
        >
          <Button
            variant="outline"
            size="sm"
            disabled={page === 1 || isFetching}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
          >
            <ChevronLeft className="size-4" /> Newer
          </Button>
          <span className="text-sm text-muted-foreground">Page {page}</span>
          <Button
            variant="outline"
            size="sm"
            disabled={!hasOlder || isFetching}
            onClick={() => setPage((current) => current + 1)}
          >
            Older <ChevronRight className="size-4" />
          </Button>
        </nav>
      )}
    </>
  );
}
