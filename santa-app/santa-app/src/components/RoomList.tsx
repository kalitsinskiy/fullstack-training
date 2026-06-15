import { RoomCard, type RoomStatus } from "./RoomCard";

export interface Room {
  id: string;
  name: string;
  code: string;
  memberCount: number;
  status: RoomStatus;
}

interface RoomListProps {
  rooms: Room[];
  onOpenRoom: (id: string) => void;
}

export function RoomList({ rooms, onOpenRoom }: RoomListProps) {
  return (
    <div className="grid [grid-template-columns:repeat(auto-fill,minmax(15rem,1fr))] gap-4 p-6">
      {rooms.map((room) => (
        <RoomCard
          key={room.id}
          name={room.name}
          code={room.code}
          memberCount={room.memberCount}
          status={room.status}
          onOpen={() => onOpenRoom(room.id)}
        />
      ))}
    </div>
  );
}
