import { useState } from 'react';
import { useRooms } from '@/features/rooms/hooks';
import { Gift, Plus } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/EmptyState';
import { Button } from '@/components/ui/button';
import { RoomCard } from '@/features/rooms/RoomCard';
import { CreateRoomDialog } from '@/features/rooms/CreateRoomDialog';
import { JoinRoomDialog } from '@/features/rooms/JoinRoomDialog';

/**
 * Dashboard — list of rooms the user owns or joined.
 * TODO(lesson 03 / 04): fetch GET /api/rooms with TanStack Query, render RoomCard grid,
 * wire "Create room" (POST /api/rooms) and "Join with code" (POST /api/rooms/:id/join).
 */
export function RoomListPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const { data, isLoading, isError, refetch } = useRooms();
  const rooms = data?.data ?? [];

  return (
    <>
      <PageHeader
        title="Your rooms"
        description="Rooms you created or joined."
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setJoinOpen(true)}>
              Join
            </Button>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus /> New room
            </Button>
          </div>
        }
      />

      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-28 animate-pulse rounded-lg border-border bg-muted/40"
            ></div>
          ))}
        </div>
      )}

      {isError && !isLoading && (
        <div className="rounded-lg border border-dashed border-border py-12 text-center">
          <p className="text-sm text-muted-foreground">
            Couldn't load your rooms.
          </p>
          <Button variant="outline" className="mt-3" onClick={() => refetch()}>
            Try again
          </Button>
        </div>
      )}

      {!isLoading && !isError && rooms.length === 0 && (
        <EmptyState
          icon={Gift}
          title="No rooms yet"
          description="Create your first Secret Santa room or join one with an invite code."
          action={
            <div className="flex gap-2">
              <Button onClick={() => setCreateOpen(true)}>
                <Plus /> Create a room
              </Button>
              <Button variant="outline" onClick={() => setJoinOpen(true)}>
                Join with code
              </Button>
            </div>
          }
        />
      )}

      {!isLoading && !isError && rooms.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rooms.map((room) => (
            <RoomCard key={room.id} room={room} />
          ))}
        </div>
      )}

      <CreateRoomDialog open={createOpen} onOpenChange={setCreateOpen} />
      <JoinRoomDialog open={joinOpen} onOpenChange={setJoinOpen} />
    </>
  );
}
