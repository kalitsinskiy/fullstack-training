import { useParams } from 'react-router';

export function RoomsDetailedPage() {
  const { id } = useParams<{ id: string }>();

  if (!id) return <p>Room not found.</p>;

  return <h1>Room {id}</h1>;
}
