import RoomCard from "./RoomCard";

interface Room {
  id: string;
  name: string;
  code: string;
  memberCount: number;
  status: "pending" | "drawn" | "closed";
}

const ROOMS: Room[] = [
  {
    id: "1",
    name: "Fullstack Team",
    code: "FLT-2026",
    memberCount: 5,
    status: "pending",
  },
  {
    id: "2",
    name: "Family Exchange",
    code: "FAM-2026",
    memberCount: 12,
    status: "drawn",
  },
  {
    id: "3",
    name: "Academiya Office",
    code: "ACA-2026",
    memberCount: 8,
    status: "closed",
  },
  {
    id: "4",
    name: "University Friends",
    code: "UNI-2026",
    memberCount: 9,
    status: "pending",
  },
  {
    id: "5",
    name: "Book Club",
    code: "BCK-2026",
    memberCount: 6,
    status: "drawn",
  },
  {
    id: "6",
    name: "Neighbours",
    code: "NBR-2026",
    memberCount: 4,
    status: "pending",
  },
];

interface RoomListProps {
  rooms?: Room[];
  onJoinRoom?: (id: string) => void;
}

export default function RoomList({ rooms = ROOMS, onJoinRoom }: RoomListProps) {
  return (
    <section className="w-full">
      <h2 className="mb-4 text-xl font-semibold text-gray-800">Rooms</h2>

      {rooms.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-12 text-gray-500">
          <p>No rooms yet.</p>
          <button
            type="button"
            onClick={() => console.log("TODO: create flow")}
            className="bg-brand hover:bg-brand-dark rounded px-4 py-2 text-sm font-medium text-white transition-colors"
          >
            Create Room
          </button>
        </div>
      ) : (
        <div className="grid [grid-template-columns:repeat(auto-fill,minmax(15rem,1fr))] gap-4">
          {rooms.map((room) => {
            if (room.status === "pending") {
              return (
                <RoomCard
                  key={room.id}
                  name={room.name}
                  code={room.code}
                  memberCount={room.memberCount}
                  status="pending"
                  onOpen={() =>
                    onJoinRoom?.(room.id) ?? console.log("join", room.code)
                  }
                />
              );
            }
            if (room.status === "drawn") {
              return (
                <RoomCard
                  key={room.id}
                  name={room.name}
                  code={room.code}
                  memberCount={room.memberCount}
                  status="drawn"
                  onView={() => console.log("view", room.code)}
                />
              );
            }
            return (
              <RoomCard
                key={room.id}
                name={room.name}
                code={room.code}
                memberCount={room.memberCount}
                status="closed"
              />
            );
          })}
        </div>
      )}
    </section>
  );
}
