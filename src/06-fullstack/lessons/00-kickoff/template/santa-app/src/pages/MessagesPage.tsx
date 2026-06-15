import { MessageCircle } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/EmptyState';

/**
 * Anonymous messaging — chat with your Santa / your giftee without revealing identity.
 * TODO(lesson 08): two-pane chat UI, send via santa-notifications relay.
 * TODO(lesson 07): receive messages in real time over the WebSocket (useSocket).
 */
export function MessagesPage() {
  return (
    <>
      <PageHeader title="Messages" description="Anonymous chat with your match." />
      <EmptyState
        icon={MessageCircle}
        title="No messages yet"
        description="Once the draw is done, you can send anonymous wishes to your giftee."
      />
    </>
  );
}
