import { useParams, useNavigate } from "react-router";

export function RoomDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  return (
    <div>
      <button
        onClick={() => navigate("/rooms")}
        className="text-brand mb-4 text-sm hover:underline"
      >
        ← Back to Rooms
      </button>
      <h1 className="text-text-base text-2xl font-semibold">Room {id}</h1>
      <p className="text-text-muted mt-2">Room details coming in Lesson 08.</p>
    </div>
  );
}
