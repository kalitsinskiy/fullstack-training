import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useApi } from "../hooks/useApi";
import RoomCard, { type RoomStatus } from "./RoomCard";

export interface Room {
  id: string;
  name: string;
  code: string;
  participantCount: number;
  status: RoomStatus;
}

interface RoomsResponse {
  data: Array<{
    id: string;
    name: string;
    inviteCode: string;
    participants: string[];
    status: "pending" | "drawn";
  }>;
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

function mapRoomStatus(status: "pending" | "drawn"): RoomStatus {
  return status === "drawn" ? "drawn" : "open";
}

export default function RoomList() {
  const api = useApi();
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadRooms = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await api.get<RoomsResponse>("/rooms?limit=100");
        if (!isMounted) {
          return;
        }

        setRooms(
          response.data.map((room) => ({
            id: room.id,
            name: room.name,
            code: room.inviteCode,
            participantCount: room.participants.length,
            status: mapRoomStatus(room.status),
          })),
        );
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Failed to load rooms");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadRooms();

    return () => {
      isMounted = false;
    };
  }, [api]);

  return (
    <section className="bg-(--bg)">
      <div className="mx-auto max-w-6xl p-6">
        <div className="mb-6 space-y-2 text-center">
          <p className="text-muted-foreground text-sm tracking-[0.28em] uppercase">
            Rooms
          </p>
          <h2 className="text-3xl font-semibold text-(--text)">Your rooms</h2>
        </div>

        {isLoading ? (
          <div className="rounded-3xl border border-(--border) bg-(--surface) p-6 text-sm text-(--muted) shadow-sm">
            Loading rooms...
          </div>
        ) : null}

        {error ? (
          <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-sm text-red-700 shadow-sm">
            {error}
          </div>
        ) : null}

        {!isLoading && !error && rooms.length === 0 ? (
          <div className="rounded-3xl border border-(--border) bg-(--surface) p-6 text-sm text-(--muted) shadow-sm">
            No rooms found yet.
          </div>
        ) : null}

        {!isLoading && !error && rooms.length > 0 ? (
          <div className="grid [grid-template-columns:repeat(auto-fill,minmax(15rem,1fr))] gap-4 p-6">
            {rooms.map((room) => (
              <RoomCard
                key={room.id}
                name={room.name}
                code={room.code}
                participantCount={room.participantCount}
                status={room.status}
                onOpen={() => navigate(`/rooms/${room.id}`)}
              />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
