import { RoomCard, type RoomCardProps } from "./RoomCard";

const SAMPLE_ROOMS: RoomCardProps[] = [
  {
    name: "Office Party 2025",
    code: "XMAS01",
    memberCount: 12,
    status: "pending",
    onOpen: () => console.log("XMAS01"),
  },
  {
    name: "Family Circle",
    code: "FAM42",
    memberCount: 6,
    status: "drawn",
    onOpen: () => console.log("FAM42"),
  },
  {
    name: "Dev Team Gifting",
    code: "DEV99",
    memberCount: 8,
    status: "closed",
    onOpen: () => console.log("DEV99"),
  },
  {
    name: "Friends Forever",
    code: "FRND7",
    memberCount: 5,
    status: "pending",
    onOpen: () => console.log("FRND7"),
  },
  {
    name: "Book Club",
    code: "BOOK3",
    memberCount: 10,
    status: "drawn",
    onOpen: () => console.log("BOOK3"),
  },
  {
    name: "Neighbours 2025",
    code: "NEIG8",
    memberCount: 4,
    status: "pending",
    onOpen: () => console.log("NEIG8"),
  },
];

interface RoomListProps {
  rooms?: RoomCardProps[];
}

export function RoomList({ rooms = SAMPLE_ROOMS }: RoomListProps) {
  return (
    <section className="p-6">
      <h2 className="text-brand mb-4 text-xl font-semibold">Rooms</h2>
      <div className="grid [grid-template-columns:repeat(auto-fill,minmax(15rem,1fr))] gap-4">
        {rooms.map((room) => (
          <RoomCard key={room.code} {...room} />
        ))}
      </div>
    </section>
  );
}
