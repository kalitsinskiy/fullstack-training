import { useState } from "react";
import { Link, useParams } from "react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../services/api";
import { useAuth } from "../hooks/useAuth";
import { Button } from "./ui/button";

// ---- Types ----

type ApiRoomStatus = "pending" | "drawn";

interface RoomResponse {
  id: string;
  name: string;
  creatorId: string;
  inviteCode: string;
  participants: string[];
  status: ApiRoomStatus;
  drawDate?: string;
  createdAt: string;
  updatedAt: string;
}

// ---- Helpers ----

function formatDate(value: string | undefined): string {
  if (!value) return "Not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not set";
  return date.toLocaleString();
}

function getBadgeClass(status: ApiRoomStatus): string {
  return status === "drawn"
    ? "bg-emerald-100 text-emerald-800"
    : "bg-amber-100 text-amber-800";
}

// ---- JoinRoomForm ----
// API: POST /rooms/:code/join — :code is the room's inviteCode, body is { userId }

function JoinRoomForm({ inviteCode }: { inviteCode: string }) {
  const { user } = useAuth();
  const [joinError, setJoinError] = useState<string | null>(null);
  const [joinSuccess, setJoinSuccess] = useState(false);
  const queryClient = useQueryClient();

  const join = useMutation({
    mutationFn: () =>
      api.post(`/rooms/${inviteCode}/join`, { userId: user?.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      queryClient.invalidateQueries({ queryKey: ["rooms", inviteCode] });
      setJoinError(null);
      setJoinSuccess(true);
    },
    onError: (err) => setJoinError((err as Error).message),
  });

  if (joinSuccess) {
    return <p className="text-sm text-emerald-700">Joined successfully!</p>;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        type="button"
        variant="outline"
        disabled={join.isPending || !user?.id}
        onClick={() => join.mutate()}
        className="rounded-full px-4 text-sm font-medium"
      >
        {join.isPending ? "Joining…" : "Join this room"}
      </Button>
      {joinError && <p className="w-full text-sm text-red-600">{joinError}</p>}
    </div>
  );
}

// ---- RoomDetailsPage ----

export function RoomDetailsPage() {
  const { id } = useParams();

  const { data: room, isLoading, isError, error } = useQuery({
    queryKey: ["rooms", id],
    queryFn: ({ signal }) => api.get<RoomResponse>(`/rooms/${id}`, { signal }),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <section className="rounded-3xl border border-(--border) bg-(--surface) p-6 shadow">
        <p className="text-muted-foreground text-sm">Loading room details...</p>
      </section>
    );
  }

  if (isError) {
    return (
      <section className="space-y-4 rounded-3xl border border-red-200 bg-red-50 p-6 text-red-700 shadow">
        <h2 className="text-xl font-semibold">Could not load room</h2>
        <p className="text-sm">{(error as Error).message}</p>
        <Link
          to="/rooms"
          className="inline-flex rounded-full border border-red-300 px-4 py-2 text-sm font-medium transition hover:bg-red-100"
        >
          Back to rooms
        </Link>
      </section>
    );
  }

  if (!room) return null;

  return (
    <section className="space-y-6">
      <header className="rounded-3xl border border-(--border) bg-(--surface) p-6 shadow">
        <p className="text-muted-foreground text-xs tracking-[0.22em] uppercase">Room details</p>
        <h2 className="mt-2 text-3xl font-semibold text-(--text)">{room.name}</h2>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <span className="text-muted-foreground rounded-full bg-(--bg) px-3 py-1.5 font-mono text-sm">
            Invite: {room.inviteCode}
          </span>
          <span className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold ${getBadgeClass(room.status)}`}>
            {room.status}
          </span>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <article className="rounded-2xl border border-(--border) bg-(--surface) p-4">
          <p className="text-muted-foreground text-xs tracking-[0.18em] uppercase">Participants</p>
          <p className="mt-2 text-2xl font-semibold">{room.participants.length}</p>
        </article>
        <article className="rounded-2xl border border-(--border) bg-(--surface) p-4">
          <p className="text-muted-foreground text-xs tracking-[0.18em] uppercase">Creator ID</p>
          <p className="text-muted-foreground mt-2 font-mono text-sm break-all">{room.creatorId}</p>
        </article>
        <article className="rounded-2xl border border-(--border) bg-(--surface) p-4">
          <p className="text-muted-foreground text-xs tracking-[0.18em] uppercase">Draw date</p>
          <p className="mt-2 text-sm text-(--text)">{formatDate(room.drawDate)}</p>
        </article>
        <article className="rounded-2xl border border-(--border) bg-(--surface) p-4">
          <p className="text-muted-foreground text-xs tracking-[0.18em] uppercase">Updated</p>
          <p className="mt-2 text-sm text-(--text)">{formatDate(room.updatedAt)}</p>
        </article>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Link
          to={`/rooms/${room.id}/wishlist`}
          className="rounded-full border border-(--border) bg-(--surface) px-4 py-2 text-sm font-medium transition hover:bg-(--bg)"
        >
          Edit wishlist
        </Link>
        <Link
          to="/rooms"
          className="rounded-full border border-(--border) bg-(--surface) px-4 py-2 text-sm font-medium transition hover:bg-(--bg)"
        >
          Back to rooms
        </Link>
      </div>

      {/* §6: join room */}
      {room.status === "pending" && (
        <div className="rounded-2xl border border-(--border) bg-(--surface) p-4">
          <p className="text-muted-foreground mb-3 text-xs tracking-[0.18em] uppercase">Join this room</p>
          <JoinRoomForm inviteCode={room.inviteCode} />
        </div>
      )}
    </section>
  );
}
