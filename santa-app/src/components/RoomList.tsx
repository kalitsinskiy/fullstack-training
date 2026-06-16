import { RoomCard } from "./RoomCard";

export interface Room {
  id: string;
  name: string;
  code: string;
  participantCount: number;
  status: "open" | "drawn" | "closed";
}

interface RoomListProps {
  rooms?: Room[];
  onJoinRoom?: (id: string) => void;
}

const SAMPLE_ROOMS: Room[] = [
  {
    id: "1",
    name: "Office Party 2025",
    code: "XMAS01",
    participantCount: 12,
    status: "open",
  },
  {
    id: "2",
    name: "Family Circle",
    code: "FAM42",
    participantCount: 6,
    status: "drawn",
  },
  {
    id: "3",
    name: "Dev Team Gifting",
    code: "DEV99",
    participantCount: 8,
    status: "closed",
  },
  {
    id: "4",
    name: "Friends Forever",
    code: "FRND7",
    participantCount: 5,
    status: "open",
  },
  {
    id: "5",
    name: "Book Club",
    code: "BOOK3",
    participantCount: 10,
    status: "drawn",
  },
  {
    id: "6",
    name: "Neighbours 2025",
    code: "NEIG8",
    participantCount: 4,
    status: "open",
  },
];

export function RoomList({ rooms = SAMPLE_ROOMS, onJoinRoom }: RoomListProps) {
  if (rooms.length === 0) {
    return (
      <section className="p-6 text-center">
        <p className="text-text-muted mb-4">No rooms yet.</p>
        <button
          type="button"
          onClick={() => console.log("TODO: create flow")}
          className="bg-brand hover:bg-brand-dark rounded-md px-4 py-2 text-sm font-medium text-white transition-colors"
        >
          Create Room
        </button>
      </section>
    );
  }

  return (
    <section className="p-6">
      <h2 className="text-brand mb-4 text-xl font-semibold">Rooms</h2>
      <div className="grid [grid-template-columns:repeat(auto-fill,minmax(15rem,1fr))] gap-4">
        {rooms.map((room) => {
          if (room.status === "open") {
            return (
              <RoomCard
                key={room.id}
                status="open"
                name={room.name}
                code={room.code}
                participantCount={room.participantCount}
                onJoin={() => onJoinRoom?.(room.id)}
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
                onView={() => onJoinRoom?.(room.id)}
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
    </section>
  );
}
