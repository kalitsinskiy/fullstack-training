import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router";
import { useApi } from "../hooks/useApi";

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

function formatDate(value: string | undefined): string {
  if (!value) {
    return "Not set";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Not set";
  }

  return date.toLocaleString();
}

function getBadgeClass(status: ApiRoomStatus): string {
  if (status === "drawn") {
    return "bg-emerald-100 text-emerald-800";
  }
  return "bg-amber-100 text-amber-800";
}

export function RoomDetailsPage() {
  const { id } = useParams();
  const api = useApi();
  const [room, setRoom] = useState<RoomResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadRoom = async () => {
      if (!id) {
        if (isMounted) {
          setError("Room ID is missing in the route.");
          setIsLoading(false);
        }
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const data = await api.get<RoomResponse>(`/rooms/${id}`);
        if (isMounted) {
          setRoom(data);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Failed to load room");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadRoom();

    return () => {
      isMounted = false;
    };
  }, [api, id]);

  const participantCount = useMemo(
    () => room?.participants.length ?? 0,
    [room],
  );

  if (isLoading) {
    return (
      <section className="rounded-3xl border border-(--border) bg-(--surface) p-6 shadow">
        <p className="text-sm text-(--muted)">Loading room details...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="space-y-4 rounded-3xl border border-red-200 bg-red-50 p-6 text-red-700 shadow">
        <h2 className="text-xl font-semibold">Could not load room</h2>
        <p className="text-sm">{error}</p>
        <Link
          to="/rooms"
          className="inline-flex rounded-full border border-red-300 px-4 py-2 text-sm font-medium transition hover:bg-red-100"
        >
          Back to rooms
        </Link>
      </section>
    );
  }

  if (!room) {
    return null;
  }

  return (
    <section className="space-y-6">
      <header className="rounded-3xl border border-(--border) bg-(--surface) p-6 shadow">
        <p className="text-xs tracking-[0.22em] text-(--muted) uppercase">
          Room details
        </p>
        <h2 className="mt-2 text-3xl font-semibold text-(--text)">
          {room.name}
        </h2>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <span className="rounded-full bg-(--bg) px-3 py-1.5 font-mono text-sm text-(--muted)">
            Invite: {room.inviteCode}
          </span>
          <span
            className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold ${getBadgeClass(room.status)}`}
          >
            {room.status}
          </span>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <article className="rounded-2xl border border-(--border) bg-(--surface) p-4">
          <p className="text-xs tracking-[0.18em] text-(--muted) uppercase">
            Participants
          </p>
          <p className="mt-2 text-2xl font-semibold">{participantCount}</p>
        </article>
        <article className="rounded-2xl border border-(--border) bg-(--surface) p-4">
          <p className="text-xs tracking-[0.18em] text-(--muted) uppercase">
            Creator ID
          </p>
          <p className="mt-2 truncate font-mono text-sm text-(--muted)">
            {room.creatorId}
          </p>
        </article>
        <article className="rounded-2xl border border-(--border) bg-(--surface) p-4">
          <p className="text-xs tracking-[0.18em] text-(--muted) uppercase">
            Draw date
          </p>
          <p className="mt-2 text-sm text-(--text)">
            {formatDate(room.drawDate)}
          </p>
        </article>
        <article className="rounded-2xl border border-(--border) bg-(--surface) p-4">
          <p className="text-xs tracking-[0.18em] text-(--muted) uppercase">
            Updated
          </p>
          <p className="mt-2 text-sm text-(--text)">
            {formatDate(room.updatedAt)}
          </p>
        </article>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Link
          to="/rooms"
          className="rounded-full border border-(--border) bg-(--surface) px-4 py-2 text-sm font-medium transition hover:bg-(--bg)"
        >
          Back to rooms
        </Link>
        <Link
          to={`/rooms/${room.id}/wishlist`}
          className="bg-brand hover:bg-brand-dark rounded-full px-4 py-2 text-sm font-semibold text-(--button-text) transition"
        >
          Manage my wishlist
        </Link>
      </div>
    </section>
  );
}
