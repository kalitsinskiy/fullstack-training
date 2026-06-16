import { useNavigate } from 'react-router';
import { RoomCard } from '../RoomCard';
import { Button } from '@/components/ui/button';
import type { Room } from '@/types/api';

export function RoomList({ rooms }: { rooms: Room[] }) {
  const navigate = useNavigate();

  return (
    <main className="flex-1">
      <div className="px-[clamp(1rem,4vw,3rem)] pt-[clamp(1.5rem,4vw,3rem)]">
        <h2 className="text-foreground text-2xl font-bold tracking-[-0.02em]">My Rooms</h2>
      </div>

      {rooms.length === 0 ? (
        <div className="flex flex-col items-center gap-4 p-[clamp(1rem,4vw,3rem)] text-center">
          <p className="text-muted-foreground">No rooms yet.</p>
          <Button onClick={() => console.log('TODO: create flow')}>Create Room</Button>
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-[clamp(1rem,2vw,2rem)] p-[clamp(1rem,4vw,3rem)]">
          {rooms.map((room) => (
            <RoomCard
              key={room.id}
              room={room}
              onOpen={() => navigate(`/rooms/${room.id}`)}
              onJoin={() => navigate(`/rooms/${room.id}`)}
            />
          ))}
        </div>
      )}
    </main>
  );
}
