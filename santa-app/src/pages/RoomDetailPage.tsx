import { useParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import type { Room } from '@/types/api';
import { useAuth } from '@/hooks/useAuth';
import { WishlistEditor } from '@/components/WishlistEditor';
import { DrawButton } from '@/components/DrawButton';
import { MyAssignment } from '@/components/MyAssignment';
import { ExchangeScheduler } from '@/components/ExchangeScheduler';
import { DeleteRoomButton } from '@/components/DeleteRoomButton';
import { StatusMessage } from '@/components/ui/StatusMessage/StatusMessage';
import { Heading } from '@/components/ui/Heading';
import { Muted } from '@/components/ui/Muted';

export function RoomsDetailedPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const {
    data: room,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['rooms', id],
    queryFn: ({ signal }) => api.get<Room>(`/api/rooms/${id}`, { signal }),
    enabled: !!id,
  });

  if (!id) return <StatusMessage>Room not found.</StatusMessage>;
  if (isLoading) return <StatusMessage>Loading room…</StatusMessage>;
  if (isError) return <StatusMessage variant="error">{(error as Error).message}</StatusMessage>;
  if (!room) return null;

  const isOwner = room.ownerId === user?.id;
  const isClosed = room.status === 'closed';

  return (
    <main className="flex flex-col gap-6 px-[clamp(1rem,4vw,3rem)] py-[clamp(1.5rem,4vw,3rem)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Heading level="page">{room.name}</Heading>
          <Muted>
            Code <span className="font-mono">{room.code}</span> | {room.members.length} participants
            | {room.status}
          </Muted>
        </div>
        <div className="flex items-start gap-2">
          {isOwner && room.status === 'pending' && <DrawButton room={room} />}
          {isOwner && <DeleteRoomButton roomId={room.id} />}
        </div>
      </div>

      {room.exchangeDate && (
        <section className="rounded-card border-border border p-6">
          <Heading>Gift exchange</Heading>
          <Muted className="mt-1">
            {new Date(room.exchangeDate).toLocaleString()} | {room.exchangePlace}
          </Muted>
        </section>
      )}

      {isOwner && room.status === 'drawn' && <ExchangeScheduler room={room} />}

      <MyAssignment room={room} />

      <section className="flex-flex-col gap-3">
        <Heading>My Wishlist</Heading>
        <WishlistEditor roomId={id} disabled={isClosed} />
      </section>
    </main>
  );
}
