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
          {rooms.map((room) => (
            <RoomCard
              key={room.id}
              name={room.name}
              code={room.code}
              memberCount={room.memberCount}
              status={room.status}
              onOpen={
                room.status === "pending"
                  ? () => onJoinRoom?.(room.id)
                  : undefined
              }
              onView={
                room.status === "drawn"
                  ? () => onJoinRoom?.(room.id)
                  : undefined
              }
            />
          ))}
        </div>
      )}
    </section>
  );
}
