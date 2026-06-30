import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, ApiError, getErrorMessage } from '@/services/api';
import { RoomList } from '@/components/RoomList';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ApiRoom {
  _id: string;
  id?: string;
  name: string;
  inviteCode: string;
  participants: string[];
  status: 'pending' | 'drawn';
}

interface PaginatedRooms {
  data: ApiRoom[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

function roomId(r: ApiRoom) {
  return r._id ?? r.id ?? '';
}

export function RoomsPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [joinCode, setJoinCode] = useState('');
  const [joinError, setJoinError] = useState('');
  const [joinOpen, setJoinOpen] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['rooms'],
    queryFn: () => api.get<PaginatedRooms>('/api/rooms'),
  });

  const join = useMutation({
    mutationFn: (code: string) => api.post<ApiRoom>(`/api/rooms/${code}/join`),
    onSuccess: (room) => {
      qc.invalidateQueries({ queryKey: ['rooms'] });
      qc.invalidateQueries({ queryKey: ['rooms', roomId(room)] });
      setJoinCode('');
      setJoinOpen(false);
      navigate(`/rooms/${roomId(room)}`);
    },
    onError: (err) => setJoinError(getErrorMessage(err)),
  });

  const rooms = (data?.data ?? []).map((r) => ({
    id: roomId(r),
    name: r.name,
    code: r.inviteCode,
    participantCount: r.participants.length,
    status: (r.status === 'pending' ? 'open' : 'drawn') as 'open' | 'drawn' | 'closed',
  }));

  return (
    <div>
      <div className="mb-4 flex items-center justify-between px-6 pt-2">
        <h1 className="text-2xl font-semibold">Rooms</h1>
        <Button
          variant="outline"
          size="sm"
          onClick={() => { setJoinOpen((v) => !v); setJoinError(''); }}
        >
          {joinOpen ? 'Cancel' : 'Join a room'}
        </Button>
      </div>

      {joinOpen && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setJoinError('');
            if (joinCode.trim()) join.mutate(joinCode.trim().toUpperCase());
          }}
          className="mx-6 mb-6 flex flex-col gap-2 rounded-md border border-gray-200 bg-gray-50 p-4"
        >
          <Label htmlFor="join-code">Invite code</Label>
          <div className="flex gap-2">
            <Input
              id="join-code"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              placeholder="e.g. ABC123"
              className="font-mono uppercase"
              maxLength={6}
            />
            <Button type="submit" disabled={join.isPending || !joinCode.trim()}>
              {join.isPending ? 'Joining…' : 'Join'}
            </Button>
          </div>
          {joinError && <p className="text-sm text-red-600">{joinError}</p>}
        </form>
      )}

      {isLoading && <p className="px-6 text-gray-500">Loading rooms…</p>}
      {error && !(error instanceof ApiError) && (
        <p className="px-6 text-red-600">{getErrorMessage(error)}</p>
      )}
      {!isLoading && (
        <RoomList
          rooms={rooms}
          onJoinRoom={(id) => navigate(`/rooms/${id}`)}
        />
      )}
    </div>
  );
}
