import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight, MessageCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/EmptyState';
import { Card, CardContent } from '@/components/ui/card';
import type { RoomSummary } from '@/types/api';

/**
 * Anonymous messaging hub. You can only message your match after the draw, so
 * this lists the rooms whose draw is done and routes each into its own thread.
 */
export function MessagesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['rooms'],
    queryFn: async () =>
      (await api.get<{ data: RoomSummary[] }>('/api/rooms')).data,
  });
  const rooms = data?.data ?? [];
  const drawn = rooms.filter((r) => r.status === 'drawn');

  return (
    <>
      <PageHeader
        title="Messages"
        description="Anonymous chat with your match — open a room to start."
      />

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : drawn.length === 0 ? (
        <EmptyState
          icon={MessageCircle}
          title="No rooms ready for messaging yet"
          description="Once a room's draw is done, you can send anonymous wishes to your giftee and reply to your Secret Santa here."
        />
      ) : (
        <div className="space-y-2">
          {drawn.map((room) => (
            <Link key={room.id} to={`/rooms/${room.id}/messages`}>
              <Card className="transition-colors hover:border-primary/50">
                <CardContent className="flex items-center justify-between py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex size-9 items-center justify-center rounded-full bg-primary/10">
                      <MessageCircle className="size-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{room.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {room.participantCount} participants
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="size-4 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
