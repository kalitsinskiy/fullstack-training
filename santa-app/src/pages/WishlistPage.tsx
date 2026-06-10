import { useParams } from 'react-router';

export function WishlistPage() {
  const { id } = useParams<{ id: string }>();

  return <h1>Wishlist for room {id}</h1>;
}
