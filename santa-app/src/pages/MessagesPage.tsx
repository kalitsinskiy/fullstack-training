import { MessageCircle } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/EmptyState';
import { useRooms } from '@/features/rooms/hooks';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { useUnreadMessages } from '@/features/messages/hooks';
import { cn } from '@/lib/utils';

/**
 * Anonymous messaging — chat with your Santa / your giftee without revealing identity.
 * TODO(lesson 08): two-pane chat UI, send via santa-notifications relay.
 * TODO(lesson 07): receive messages in real time over the WebSocket (useSocket).
 */
export function MessagesPage() {
  const { data, isLoading } = useRooms();
  const { data: unread } = useUnreadMessages();
  const drawnRooms = (data?.data ?? []).filter((r) => r.status === 'drawn');

  const unreadByRoom = new Map(
    (unread?.rooms ?? []).map((r) => [r.roomId, r.count]),
  );

  return (
    <>
      <PageHeader
        title="Messages"
        description="Anonymous chat with your matches."
      />

      {isLoading && (
        <div className="space-y-2">
          {[0, 1].map((i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-lg border border-border bg-muted/40"
            />
          ))}
        </div>
      )}

      {!isLoading && drawnRooms.length === 0 && (
        <EmptyState
          icon={MessageCircle}
          title="No chats yet"
          description="Messaging unlocks once a room's draw is done."
        />
      )}

      {drawnRooms.length > 0 && (
        <ul className="space-y-2">
          {drawnRooms.map((room) => {
            const count = unreadByRoom.get(room.id) ?? 0;

            return (
              <li key={room.id}>
                <Link to={`/rooms/${room.id}/messages`}>
                  <Card
                    className={cn(
                      'flex items-center justify-between p-4 transition-colors hover:border-primary/40',
                      count > 0 && 'border-primary/40 bg-primary/5',
                    )}
                  >
                    <span
                      className={cn(
                        'font-medium',
                        count > 0 && 'font-semibold',
                      )}
                    >
                      {room.name}
                    </span>
                    <span className="flex items-center gap-2">
                      {count > 0 && (
                        <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground">
                          {count > 9 ? '9+' : count}
                        </span>
                      )}
                      <MessageCircle
                        aria-label={
                          count > 0
                            ? `${count} unread messages`
                            : 'No unread messages'
                        }
                        className={cn(
                          'size-4',
                          count > 0 ? 'text-primary' : 'text-muted-foreground',
                        )}
                      />
                    </span>
                  </Card>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
