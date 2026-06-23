import { useParams, useNavigate } from "react-router";

export function WishlistPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  return (
    <div>
      <button
        onClick={() => navigate(`/rooms/${id}`)}
        className="text-brand mb-4 text-sm hover:underline"
      >
        ← Back to Room
      </button>
      <h1 className="text-text-base text-2xl font-semibold">Wishlist</h1>
      <p className="text-text-muted mt-2">
        Wishlist for room <strong>{id}</strong> coming in Lesson 09.
      </p>
    </div>
  );
}
