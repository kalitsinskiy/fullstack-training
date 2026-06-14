import RoomCard, { type RoomStatus } from "./RoomCard";

export interface Room {
  id: string;
  name: string;
  code: string;
  participantCount: number;
  status: RoomStatus;
}

interface RoomListProps {
  rooms: Room[];
}

export default function RoomList({ rooms }: RoomListProps) {
  return (
    <div className="grid [grid-template-columns:repeat(auto-fill,minmax(15rem,1fr))] gap-4 p-6">
      {rooms.map((room) => (
        <RoomCard
          key={room.id}
          name={room.name}
          code={room.code}
          participantCount={room.participantCount}
          status={room.status}
          onJoin={() => console.log("join room", room.id)}
          onView={() => console.log("view room", room.id)}
        />
      ))}
    </div>
  );
}
