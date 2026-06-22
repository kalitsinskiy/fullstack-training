import { useParams } from "react-router";

export function WishlistPage() {
  const { id } = useParams();
  return <h1 className="p-6 text-2xl font-semibold">Wishlist — Room {id}</h1>;
}
