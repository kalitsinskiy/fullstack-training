import { useParams, useNavigate } from "react-router";
import { WishlistEditor } from "../components/WishlistEditor";

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
      <div className="mt-6">
        {/* L09 wires it to GET/PUT /api/rooms/:id/wishlist */}
        <WishlistEditor />
      </div>
    </div>
  );
}
