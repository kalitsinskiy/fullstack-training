import { useParams } from 'react-router';
import { NotFoundPage } from './NotFoundPage';
import { WishlistEditor } from '@/components/WishlistEditor';

export function RoomDetailPage() {
  const { id } = useParams<{ id: string }>();
  if (!id) return <NotFoundPage />;
  return (
    <div className="p-6">
      <h2 className="mb-6 text-2xl font-semibold">Room {id}</h2>
      <WishlistEditor />
    </div>
  );
}
