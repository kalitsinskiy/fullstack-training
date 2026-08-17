import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { MessageCircle, Users } from 'lucide-react';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/EmptyState';
import type { RoomSummary } from '@/types/api';

interface PaginatedRooms {
  data: RoomSummary[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export function MessagesPage() {
  const navigate = useNavigate();

  const { data, isLoading } = useQuery<PaginatedRooms>({
    queryKey: ['rooms'],
    queryFn: () => api.get<PaginatedRooms>('/api/rooms').then((r) => r.data),
  });

  const drawnRooms = data?.data.filter((r) => r.status === 'drawn') ?? [];

  return (
    <>
      <PageHeader
        title="Messages"
        description="Anonymous chat with your match — select a drawn room to open the chat."
      />

      {isLoading ? (
        <p className="mt-4 text-sm text-muted-foreground">Loading…</p>
      ) : drawnRooms.length === 0 ? (
        <EmptyState
          icon={MessageCircle}
          title="No active chats"
          description="Once a room's draw is done, you can send anonymous messages to your giftee."
        />
      ) : (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {drawnRooms.map((room) => (
            <button
              key={room.id}
              type="button"
              onClick={() => navigate(`/rooms/${room.id}/messages`)}
              className="flex items-center justify-between rounded-xl border border-border bg-card px-5 py-4 text-left transition-shadow hover:shadow-md"
            >
              <div>
                <p className="font-display font-semibold">{room.name}</p>
                <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                  <Users className="size-3.5" />
                  {room.participantCount} participants
                </p>
              </div>
              <MessageCircle className="size-5 shrink-0 text-primary" />
            </button>
          ))}
        </div>
      )}
    </>
  );
}
