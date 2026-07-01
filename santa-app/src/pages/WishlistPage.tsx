import { useParams, useNavigate } from "react-router";
import { WishlistEditor } from "../components/WishlistEditor";

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
      <h1 className="text-text-base mb-6 text-2xl font-semibold">Wishlist</h1>
      {id ? (
        <WishlistEditor roomId={id} />
      ) : (
        <p className="text-danger">Missing room id.</p>
      )}
    </div>
  );
}
