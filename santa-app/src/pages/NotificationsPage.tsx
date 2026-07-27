import { Bell, Gift, ListChecks, Sparkles, UserPlus } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/EmptyState';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
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

  return (
    <Card
      className={cn(
        'flex flex-row items-start gap-3 p-4 transition-colors',
        !notification.read && 'border-primary/40 bg-primary/5',
      )}
    >
      <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
        <Icon className="size-4 text-primary" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium break-words">{notification.message}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {relativeTime(notification.createdAt)}
        </p>
      </div>

      {!notification.read && (
        <button
          type="button"
          className="shrink-0 text-xs font-medium text-primary hover:underline disabled:opacity-50"
          disabled={markRead.isPending}
          onClick={() => markRead.mutate(notification.id)}
        >
          Mark read
        </button>
      )}
    </Card>
  );
}

/**
 * Notifications — room events, draw completed, new messages.
 * TODO(lesson 07): live updates over the WebSocket + toast on new arrivals.
 */
export function NotificationsPage() {
  const { data, isPending, isError, error } = useNotifications();

  const unreadCount = data?.filter((n) => !n.read).length ?? 0;

  return (
    <>
      <PageHeader
        title="Notifications"
        description={
          unreadCount > 0
            ? `${unreadCount} unread.`
            : "What's happening in your rooms."
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

      {data && data.length === 0 && (
        <EmptyState
          icon={Bell}
          title="You're all caught up"
          description="Notifications about draws, joins, and messages will show up here."
        />
      )}

      {data && data.length > 0 && (
        <ul className="flex flex-col gap-3">
          {data.map((notification) => (
            <li key={notification.id}>
              <NotificationRow notification={notification} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
