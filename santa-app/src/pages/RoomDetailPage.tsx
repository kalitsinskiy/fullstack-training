import { useParams } from "react-router";
import WishlistEditor from "../components/WishlistEditor";

export default function RoomDetailPage() {
  const { id } = useParams<{ id: string }>();
  if (!id) return <h1>Room not found</h1>;
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">Room {id}</h1>
      <div className="max-w-2xl">
        <h2 className="text-xl font-semibold mb-4">Wishlist</h2>
        <WishlistEditor />
      </div>
    </div>
  );
}
