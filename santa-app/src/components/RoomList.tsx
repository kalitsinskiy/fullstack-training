import RoomCard, { type RoomCardProps } from "./RoomCard";

const ROOMS: Omit<RoomCardProps, "onOpen">[] = [
  {
    name: "Fullstack Team",
    code: "FLT-2026",
    memberCount: 5,
    status: "pending",
  },
  {
    name: "Family Exchange",
    code: "FAM-2026",
    memberCount: 12,
    status: "drawn",
  },
  {
    name: "Academiya Office",
    code: "ACA-2026",
    memberCount: 8,
    status: "closed",
  },
  {
    name: "University Friends",
    code: "UNI-2026",
    memberCount: 9,
    status: "pending",
  },
  { name: "Book Club", code: "BCK-2026", memberCount: 6, status: "drawn" },
  { name: "Neighbours", code: "NBR-2026", memberCount: 4, status: "pending" },
];

export default function RoomList() {
  return (
    <section className="w-full">
      <h2 className="mb-4 text-xl font-semibold text-gray-800">Rooms</h2>
      <div className="grid [grid-template-columns:repeat(auto-fill,minmax(15rem,1fr))] gap-4">
        {ROOMS.map((room) => (
          <RoomCard
            key={room.code}
            {...room}
            onOpen={() => console.log("open", room.code)}
          />
        ))}
      </div>
    </section>
  );
}
