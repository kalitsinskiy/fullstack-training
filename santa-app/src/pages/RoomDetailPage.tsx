import { useParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import type { Room } from '@/types/api';
import { useAuth } from '@/hooks/useAuth';
import { WishlistEditor } from '@/components/WishlistEditor';
import { DrawButton } from '@/components/DrawButton';
import { MyAssignment } from '@/components/MyAssignment';

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

  if (!id) return <p>Room not found.</p>;
  if (isLoading) return <p className="text-muted-foreground p-6">Loading room…</p>;
  if (isError)
    return (
      <p role="alert" className="p-6 text-red-500">
        {(error as Error).message}
      </p>
    );
  if (!room) return null;

  const isOwner = room.ownerId === user?.id;

  return (
    <main className="flex flex-col gap-6 px-[clamp(1rem,4vw,3rem)] py-[clamp(1.5rem,4vw,3rem)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-foreground text-2xl font-bold tracking-[-0.02em]">{room.name}</h1>
          <p className="text-muted-foreground text-sm">
            Code <span className="font-mono">{room.code}</span> | {room.members.length} participants
            | {room.status}
          </p>
        </div>
        {isOwner && room.status === 'pending' && <DrawButton room={room} />}
      </div>

      <MyAssignment room={room} />

      <section className="flex-flex-col gap-3">
        <h2 className="text-foreground text-lg font-bold">My Wishlist</h2>
        <WishlistEditor roomId={id} />
      </section>
    </main>
  );
}
