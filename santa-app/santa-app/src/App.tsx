import { LoginForm } from "./components/LoginForm";
import { RegisterForm } from "./components/RegisterForm";
import { RoomCard } from "./components/RoomCard";
import { RoomList, type Room } from "./components/RoomList";

const mockRooms: Room[] = [
  {
    id: "1",
    name: "Office Holiday Swap",
    code: "RM-7F2K9",
    memberCount: 8,
    status: "pending",
  },
  {
    id: "2",
    name: "Family Gift Exchange",
    code: "RM-3QX1A",
    memberCount: 12,
    status: "drawn",
  },
  {
    id: "3",
    name: "Dev Team Secret Santa",
    code: "RM-9LM4P",
    memberCount: 6,
    status: "closed",
  },
  {
    id: "4",
    name: "Book Club Surprise",
    code: "RM-2VT8R",
    memberCount: 5,
    status: "pending",
  },
  {
    id: "5",
    name: "Neighborhood Swap",
    code: "RM-6KD0Z",
    memberCount: 10,
    status: "drawn",
  },
  {
    id: "6",
    name: "Gaming Squad Santa",
    code: "RM-4WB7Y",
    memberCount: 4,
    status: "closed",
  },
];

function handleOpenRoom(id: string) {
  console.log("Open room", id);
}

function App() {
  return (
    <main className="flex min-h-screen flex-col items-center gap-8 p-6">
      <h1 className="text-brand-dark text-4xl font-semibold">Secret Santa</h1>
      <div className="flex w-full max-w-4xl flex-col items-center gap-6 md:flex-row md:items-start md:justify-center">
        <LoginForm />
        <RegisterForm />
      </div>

      <section className="w-full max-w-6xl">
        <h2 className="text-brand-dark mb-4 text-2xl font-semibold">
          Your Rooms
        </h2>
        <div className="flex flex-col gap-6 lg:flex-row">
          <div className="flex-1">
            <RoomList rooms={mockRooms} onOpenRoom={handleOpenRoom} />
          </div>
          <aside className="w-70 shrink-0">
            <h3 className="text-text/70 mb-2 text-sm font-medium">
              Sidebar preview (280px)
            </h3>
            <RoomCard
              {...mockRooms[0]}
              onOpen={() => handleOpenRoom(mockRooms[0].id)}
            />
          </aside>
        </div>
      </section>
    </main>
  );
}

export default App;
