import { LoginForm } from "./components/LoginForm";
import { RegisterForm } from "./components/RegisterForm";
import { RoomCard } from "./components/RoomCard";
import { RoomList, type Room } from "./components/RoomList";
import { useAuth } from "./hooks/useAuth";

const mockRooms: Room[] = [
  {
    id: "1",
    name: "Office Holiday Swap",
    code: "RM-7F2K9",
    participantCount: 8,
    status: "open",
  },
  {
    id: "2",
    name: "Family Gift Exchange",
    code: "RM-3QX1A",
    participantCount: 12,
    status: "drawn",
  },
  {
    id: "3",
    name: "Dev Team Secret Santa",
    code: "RM-9LM4P",
    participantCount: 6,
    status: "closed",
  },
  {
    id: "4",
    name: "Book Club Surprise",
    code: "RM-2VT8R",
    participantCount: 5,
    status: "open",
  },
  {
    id: "5",
    name: "Neighborhood Swap",
    code: "RM-6KD0Z",
    participantCount: 10,
    status: "drawn",
  },
  {
    id: "6",
    name: "Gaming Squad Santa",
    code: "RM-4WB7Y",
    participantCount: 4,
    status: "closed",
  },
];

function handleJoinRoom(id: string) {
  console.log("Join room", id);
}

function App() {
  const auth = useAuth();

  return (
    <main className="flex min-h-screen flex-col items-center gap-8 p-6">
      <div className="flex w-full max-w-4xl items-center justify-between">
        <h1 className="text-brand-dark text-4xl font-semibold">Secret Santa</h1>
        {auth.isAuthenticated && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">{auth.user?.email}</span>
            <button
              onClick={auth.logout}
              className="rounded-md border border-gray-300 px-3 py-1 text-sm hover:bg-gray-100"
            >
              Logout
            </button>
          </div>
        )}
      </div>
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
            <RoomList rooms={mockRooms} onJoinRoom={handleJoinRoom} />
          </div>
          <aside className="w-70 shrink-0">
            <h3 className="text-text/70 mb-2 text-sm font-medium">
              Sidebar preview (280px)
            </h3>
            <RoomCard
              status="open"
              name={mockRooms[0].name}
              code={mockRooms[0].code}
              participantCount={mockRooms[0].participantCount}
              onJoin={() => handleJoinRoom(mockRooms[0].id)}
            />
          </aside>
        </div>
      </section>
    </main>
  );
}

export default App;
