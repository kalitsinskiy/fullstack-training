import { RoomCard } from "./RoomCard";

export interface Room {
  id: string;
  name: string;
  code: string;
  participantCount: number;
  status: "open" | "drawn" | "closed";
}

interface RoomListProps {
  rooms: Room[];
  onJoinRoom: (id: string) => void;
}

export function RoomList({ rooms, onJoinRoom }: RoomListProps) {
  if (rooms.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <p className="text-text/60 text-lg">You haven't joined any rooms yet.</p>
        <button
          type="button"
          onClick={() => console.log("TODO: create flow")}
          className="bg-brand hover:bg-brand-dark rounded-md px-6 py-2 font-semibold text-white transition-colors"
        >
          Create Room
        </button>
      </div>
    );
  }

  return (
    <div className="grid gap-4 p-6 grid-cols-[repeat(auto-fill,minmax(15rem,1fr))]">
      {rooms.map((room) => {
        if (room.status === "open") {
          return (
            <RoomCard
              key={room.id}
              status="open"
              name={room.name}
              code={room.code}
              participantCount={room.participantCount}
              onJoin={() => onJoinRoom(room.id)}
            />
          );
        }
        if (room.status === "drawn") {
          return (
            <RoomCard
              key={room.id}
              status="drawn"
              name={room.name}
              code={room.code}
              participantCount={room.participantCount}
              onView={() => onJoinRoom(room.id)}
            />
          );
        }
        return (
          <RoomCard
            key={room.id}
            status="closed"
            name={room.name}
            code={room.code}
            participantCount={room.participantCount}
          />
        );
      })}
    </div>
  );
}
