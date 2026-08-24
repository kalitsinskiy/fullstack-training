import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MessageCircle } from 'lucide-react';
import { api, getApiErrorMessage } from '@/lib/api';
import { useUnreadMessages } from '@/features/messages/useUnreadMessages';
import { RoomChatRow } from '@/features/messages/RoomChatRow';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/EmptyState';
import { Button } from '@/components/ui/button';
import type { RoomsResponse } from '@/types/api';

const PAGE_LIMIT = 10;

export function MessageListPage() {
  const { counts } = useUnreadMessages();
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, error } = useQuery<RoomsResponse>({
    queryKey: ['rooms', 'messages', page],
    queryFn: async () => {
      const { data } = await api.get<RoomsResponse>('/api/rooms', {
        params: { page, limit: PAGE_LIMIT },
      });
      return data;
    },
  });

  const drawnRooms = (data?.data ?? []).filter((r) => r.status === 'drawn');

  if (isLoading) {
    return (
      <>
        <PageHeader
          title="Messages"
          description="Anonymous chats with your matches."
        />
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      </>
    );
  }

  if (isError) {
    return (
      <>
        <PageHeader title="Messages" />
        <p className="text-sm text-destructive">
          {getApiErrorMessage(error, 'Failed to load rooms')}
        </p>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Messages"
        description="Anonymous chats with your matches."
      />

      {drawnRooms.length === 0 ? (
        <EmptyState
          icon={MessageCircle}
          title="No active chats"
          description="Once a room's draw is done you can message your giftee and Secret Santa here."
        />
      ) : (
        <div className="space-y-2">
          {drawnRooms.map((room) => (
            <RoomChatRow
              key={room.id}
              room={room}
              unread={counts[room.id] ?? 0}
            />
          ))}
        </div>
      )}
      {data && data.meta.totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-3">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {data.meta.page} of {data.meta.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= data.meta.totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </>
  );
}
