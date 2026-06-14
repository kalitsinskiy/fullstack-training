import { useParams } from 'react-router';
import { WishlistEditor } from '@/components/WishlistEditor';

export function RoomsDetailedPage() {
  const { id } = useParams<{ id: string }>();

  if (!id) return <p>Room not found.</p>;

  return (
    <main className="flex flex-col gap-6 px-[clamp(1rem,4vw,3rem)] py-[clamp(1.5rem,4vw,3rem)]">
      <h1 className="text-foreground text-2xl font-bold tracking-[-0.02em]">Room {id}</h1>
      <WishlistEditor />
    </main>
  );
}
