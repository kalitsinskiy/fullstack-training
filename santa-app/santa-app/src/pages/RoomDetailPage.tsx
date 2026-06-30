import { useParams, useNavigate } from 'react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, ApiError, getErrorMessage } from '@/services/api';
import { useAuth } from '@/hooks/useAuth';
import { NotFoundPage } from './NotFoundPage';
import { WishlistEditor } from '@/components/WishlistEditor';
import { MyAssignment } from '@/components/MyAssignment';
import { AssigneeWishlist } from '@/components/AssigneeWishlist';
import { Button } from '@/components/ui/button';

interface ApiRoom {
  _id: string;
  id?: string;
  name: string;
  creatorId: string;
  inviteCode: string;
  participants: string[];
  status: 'pending' | 'drawn';
}

export function RoomDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: room, isLoading, error } = useQuery({
    queryKey: ['rooms', id ?? ''],
    queryFn: () => api.get<ApiRoom>(`/api/rooms/${id}`),
    enabled: !!id,
  });

  const draw = useMutation({
    mutationFn: () => api.post<ApiRoom>(`/api/rooms/${id}/draw`),
    onSuccess: (updated) => {
      qc.setQueryData(['rooms', id ?? ''], updated);
      qc.invalidateQueries({ queryKey: ['rooms'] });
      qc.invalidateQueries({ queryKey: ['rooms', id, 'assignment'] });
      qc.invalidateQueries({ queryKey: ['rooms', id, 'assignment', 'wishlist'] });
    },
  });

  if (!id) return <NotFoundPage />;

  if (isLoading) return <p className="p-6 text-gray-500">Loading room…</p>;

  if (error instanceof ApiError && error.status === 404) return <NotFoundPage />;
  if (error) {
    return (
      <div className="p-6">
        <p className="text-red-600">{getErrorMessage(error)}</p>
        <Button variant="ghost" size="sm" className="mt-2" onClick={() => navigate('/rooms')}>
          ← Back to rooms
        </Button>
      </div>
    );
  }

  if (!room) return null;

  const roomId = room._id ?? room.id ?? id;
  const isAdmin = user?.id === room.creatorId;
  const statusLabel = room.status === 'pending' ? 'Open' : 'Drawn';

  return (
    <div className="mx-auto max-w-2xl p-6">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-semibold">{room.name}</h2>
          <p className="mt-1 text-sm text-gray-500">
            <span className="font-mono">{room.inviteCode}</span>
            {' · '}
            {room.participants.length} participant{room.participants.length !== 1 ? 's' : ''}
            {' · '}
            <span className={room.status === 'pending' ? 'text-green-600' : 'text-blue-600'}>
              {statusLabel}
            </span>
          </p>
        </div>

        {isAdmin && room.status === 'pending' && (
          <div className="flex flex-col items-end gap-1">
            <Button
              size="sm"
              onClick={() => draw.mutate()}
              disabled={draw.isPending || room.participants.length < 3}
            >
              {draw.isPending ? 'Drawing…' : 'Trigger Draw'}
            </Button>
            {room.participants.length < 3 && (
              <p className="text-xs text-gray-400">Need ≥ 3 participants</p>
            )}
            {draw.isError && (
              <p className="text-xs text-red-600">{getErrorMessage(draw.error)}</p>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-8">
        <section>
          <h3 className="mb-3 text-lg font-semibold">My Wishlist</h3>
          <WishlistEditor roomId={roomId} />
        </section>

        <section>
          <h3 className="mb-3 text-lg font-semibold">My Assignment</h3>
          <MyAssignment roomId={roomId} />
        </section>

        <section>
          <h3 className="mb-3 text-lg font-semibold">Assignee's Wishlist</h3>
          <AssigneeWishlist roomId={roomId} />
        </section>
      </div>
    </div>
  );
}
