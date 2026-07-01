import { useNavigate } from "react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "../services/api";
import { RoomCard } from "./RoomCard";

export interface Room {
  id: string;
  name: string;
  code: string;
  participantCount: number;
  status: "open" | "drawn" | "closed";
}

interface RawRoom {
  _id: string;
  name: string;
  inviteCode: string;
  participants: string[];
  status: "pending" | "drawn";
}

export function mapRoom(raw: RawRoom): Room {
  return {
    id: raw._id,
    name: raw.name,
    code: raw.inviteCode,
    participantCount: raw.participants.length,
    status: raw.status === "drawn" ? "drawn" : "open",
  };
}

export function RoomList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    data: rooms = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["rooms"],
    queryFn: async ({ signal }) => {
      const res = await api.get<{ data: RawRoom[] }>("/rooms", { signal });
      return res.data.map(mapRoom);
    },
  });

  const join = useMutation({
    mutationFn: (code: string) => api.post<RawRoom>(`/rooms/${code}/join`),
    onSuccess: (raw) => {
      const room = mapRoom(raw);
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      queryClient.invalidateQueries({ queryKey: ["rooms", room.id] });
      navigate(`/rooms/${room.id}`);
    },
    onError: (err) => {
      alert(err instanceof ApiError ? err.message : "Failed to join room");
    },
  });

  if (isLoading) return <p className="text-text-muted p-6">Loading…</p>;

  if (isError) {
    return (
      <p role="alert" className="text-danger p-6">
        {error instanceof Error ? error.message : "Failed to load rooms"}
      </p>
    );
  }

  if (rooms.length === 0) {
    return (
      <section className="p-6 text-center">
        <p className="text-text-muted">No rooms yet — create one to get started.</p>
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
                onJoin={() => join.mutate(room.code)}
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
                onView={() => navigate(`/rooms/${room.id}`)}
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
