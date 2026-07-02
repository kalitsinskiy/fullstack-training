import { Bell } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/EmptyState';

/**
 * Notifications — room events, draw completed, new messages.
 * TODO(lesson 06): fetch notification list from santa-notifications (HTTP).
 * TODO(lesson 07): live updates over the WebSocket + toast on new arrivals.
 */
export function NotificationsPage() {
  return (
    <>
      <PageHeader title="Notifications" description="What's happening in your rooms." />
      <EmptyState
        icon={Bell}
        title="You're all caught up"
        description="Notifications about draws, joins, and messages will show up here."
      />
    </>
  );
}
