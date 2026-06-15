import { useParams } from "react-router";

export default function WishlistPage() {
  const { id } = useParams();
  return <h1>Wishlist for room {id}</h1>;
}
