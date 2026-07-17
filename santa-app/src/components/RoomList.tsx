import RoomCard from "./RoomCard";

interface Room {
  id: string;
  name: string;
  code: string;
  memberCount: number;
  status: "pending" | "drawn" | "closed";
}

interface RoomListProps {
  rooms: Room[];
  onJoinRoom?: (id: string) => void;
}

export default function RoomList({ rooms, onJoinRoom }: RoomListProps) {
  return (
    <section className="w-full">
      <h2 className="mb-4 text-xl font-semibold text-gray-800">Rooms</h2>

      {rooms.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-12 text-gray-500">
          <p>No rooms yet.</p>
        </div>
      ) : (
        <div className="grid [grid-template-columns:repeat(auto-fill,minmax(15rem,1fr))] gap-4">
          {rooms.map((room) => {
            const handler = () => onJoinRoom?.(room.id);
            if (room.status === 'pending') {
              return (
                <RoomCard
                  key={room.id}
                  status="pending"
                  name={room.name}
                  code={room.code}
                  memberCount={room.memberCount}
                  onOpen={handler}
                />
              );
            }
            if (room.status === 'drawn') {
              return (
                <RoomCard
                  key={room.id}
                  status="drawn"
                  name={room.name}
                  code={room.code}
                  memberCount={room.memberCount}
                  onView={handler}
                />
              );
            }
            return (
              <RoomCard
                key={room.id}
                status="closed"
                name={room.name}
                code={room.code}
                memberCount={room.memberCount}
              />
            );
          })}
        </div>
      )}
    </section>
  );
}
