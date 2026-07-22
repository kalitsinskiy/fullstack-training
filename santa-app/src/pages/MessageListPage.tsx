import { useQuery } from '@tanstack/react-query';
import { MessageCircle } from 'lucide-react';
import { api, getApiErrorMessage } from '@/lib/api';
import { useUnreadMessages } from '@/features/messages/useUnreadMessages';
import { RoomChatRow } from '@/features/messages/RoomChatRow';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/EmptyState';
import type { RoomDetail } from '@/types/api';

interface RoomsResponse {
  data: RoomDetail[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export function MessageListPage() {
  const { counts } = useUnreadMessages();

  const { data, isLoading, isError, error } = useQuery<RoomsResponse>({
    queryKey: ['rooms'],
    queryFn: async () => {
      const { data } = await api.get<RoomsResponse>('/api/rooms');
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
    </>
  );
}
