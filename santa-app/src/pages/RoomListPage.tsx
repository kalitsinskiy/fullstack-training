import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { api, getApiErrorMessage } from '@/lib/api';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { RoomDetail, RoomSummary } from '@/types/api';

const CURRENCIES = ['$', '€', '£', '₴', 'zł'] as const;

interface PaginatedRooms {
  data: RoomSummary[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

function StatusBadge({ status }: { status: 'pending' | 'drawn' }) {
  return (
    <span
      className={
        status === 'drawn'
          ? 'rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary'
          : 'rounded-full bg-secondary/10 px-2.5 py-0.5 text-xs font-medium text-secondary'
      }
    >
      {status}
    </span>
  );
}

export function RoomListPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [roomName, setRoomName] = useState('');
  const [currency, setCurrency] = useState<string>('₴');
  const [budget, setBudget] = useState('');
  const [inviteCode, setInviteCode] = useState('');

  const { data, isLoading } = useQuery<PaginatedRooms>({
    queryKey: ['rooms'],
    queryFn: () => api.get<PaginatedRooms>('/api/rooms').then((r) => r.data),
  });

  const createRoom = useMutation({
    mutationFn: (body: { name: string; budget?: number; currency?: string }) =>
      api.post<RoomDetail>('/api/rooms', body).then((r) => r.data),
    onSuccess: (room) => {
      qc.invalidateQueries({ queryKey: ['rooms'] });
      toast.success(`Room "${room.name}" created`);
      setRoomName('');
      setBudget('');
      navigate(`/rooms/${room.id}`);
    },
    onError: (err) =>
      toast.error(getApiErrorMessage(err, 'Failed to create room')),
  });

  const joinRoom = useMutation({
    mutationFn: (code: string) =>
      api
        .post<RoomDetail>('/api/rooms/join', { inviteCode: code })
        .then((r) => r.data),
    onSuccess: (room) => {
      qc.invalidateQueries({ queryKey: ['rooms'] });
      toast.success(`Joined "${room.name}"`);
      setInviteCode('');
      navigate(`/rooms/${room.id}`);
    },
    onError: (err) =>
      toast.error(getApiErrorMessage(err, 'Invalid or expired invite code')),
  });

  function handleCreate(e: FormEvent) {
    e.preventDefault();
    const body: { name: string; budget?: number; currency?: string } = {
      name: roomName,
    };
    if (budget) {
      body.budget = Number(budget);
      body.currency = currency;
    }
    createRoom.mutate(body);
  }

  function handleJoin(e: FormEvent) {
    e.preventDefault();
    joinRoom.mutate(inviteCode.trim());
  }

  const rooms = data?.data ?? [];

  return (
    <>
      <PageHeader
        title="Your rooms"
        description="Rooms you created or joined."
      />

      <div className="grid gap-4 md:grid-cols-2">
        {/* Create a room */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Create a room</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <Input
                placeholder="Room name"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                required
              />
              <div>
                <Label className="mb-1.5 block text-sm text-muted-foreground">
                  Gift budget per person (optional)
                </Label>
                <div className="flex gap-2">
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="rounded-md border border-input bg-background px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    {CURRENCIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  <Input
                    type="number"
                    min={1}
                    max={1000000}
                    placeholder="e.g. 500"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                  />
                </div>
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={createRoom.isPending}
              >
                <Plus className="size-4" />
                {createRoom.isPending ? 'Creating…' : 'Create'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Join with an invite */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Join with an invite</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleJoin} className="flex gap-2">
              <Input
                placeholder="Invite code"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                required
              />
              <Button
                type="submit"
                variant="outline"
                disabled={joinRoom.isPending}
              >
                {joinRoom.isPending ? '…' : 'Join'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Room cards */}
      {isLoading ? (
        <p className="mt-6 text-sm text-muted-foreground">Loading…</p>
      ) : rooms.length === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">
          No rooms yet. Create one above.
        </p>
      ) : (
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {rooms.map((room) => (
            <button
              key={room.id}
              type="button"
              onClick={() => navigate(`/rooms/${room.id}`)}
              className="rounded-xl border border-border bg-card p-5 text-left transition-shadow hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="font-display font-semibold">{room.name}</span>
                <StatusBadge status={room.status} />
              </div>
              <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Users className="size-4" />
                  {room.participantCount} participants
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </>
  );
}
