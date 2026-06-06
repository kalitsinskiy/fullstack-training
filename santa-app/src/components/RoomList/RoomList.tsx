import { RoomCard } from '../RoomCard';

interface Room {
  code: string;
  name: string;
  memberCount: number;
  status: 'pending' | 'drawn' | 'closed';
}

export function RoomList({ rooms }: { rooms: Room[] }) {
  return (
    <main className="flex-1">
      <div className="px-[clamp(1rem,4vw,3rem)] pt-[clamp(1.5rem,4vw,3rem)]">
        <h2 className="text-2xl font-bold tracking-[-0.02em] text-fg">My Rooms</h2>
      </div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-[clamp(1rem,2vw,2rem)] p-[clamp(1rem,4vw,3rem)]">
        {rooms.map((room) => (
          <RoomCard
            key={room.code}
            {...room}
            onOpen={() => {
              console.log('open', room.code);
            }}
          />
        ))}
      </div>
    </main>
  );
}
