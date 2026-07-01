import { useParams, useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "../services/api";
import { WishlistEditor } from "../components/WishlistEditor";
import { mapRoom } from "../components/RoomList";

export function RoomDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const {
    data: room,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["rooms", id],
    queryFn: ({ signal }) =>
      api
        .get<Parameters<typeof mapRoom>[0]>(`/rooms/${id}`, { signal })
        .then(mapRoom),
    enabled: !!id,
  });

  if (!id) {
    return <p className="text-danger">Missing room id.</p>;
  }

  return (
    <div>
      <button
        onClick={() => navigate("/rooms")}
        className="text-brand mb-4 text-sm hover:underline"
      >
        ← Back to Rooms
      </button>

      {isLoading ? (
        <p className="text-text-muted">Loading room…</p>
      ) : isError ? (
        <p role="alert" className="text-danger">
          {error instanceof Error ? error.message : "Failed to load room"}
        </p>
      ) : (
        <>
          <div className="mb-6">
            <h1 className="text-text-base text-2xl font-semibold">
              {room?.name ?? `Room ${id}`}
            </h1>
            <p className="text-text-muted mt-1 text-sm">
              Invite code: <span className="font-mono">{room?.code}</span> ·{" "}
              {room?.participantCount} participant
              {room?.participantCount === 1 ? "" : "s"}
            </p>
          </div>

          <WishlistEditor roomId={id} />
        </>
      )}
    </div>
  );
}
