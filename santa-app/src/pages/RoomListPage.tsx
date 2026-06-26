import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Gift, Plus, Users, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { api, getApiErrorMessage } from '@/lib/api';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/EmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { RoomDetail } from '@/types/api';

interface PaginatedRooms {
  data: RoomDetail[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

const CURRENCIES = ['$', '€', '£', '₴', 'zł'];

export function RoomListPage() {
  const qc = useQueryClient();
  const [name, setName] = useState('');
  const [budget, setBudget] = useState('');
  const [currency, setCurrency] = useState('₴');
  const [joinCode, setJoinCode] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['rooms'],
    queryFn: async () => (await api.get<PaginatedRooms>('/api/rooms')).data,
  });

  const createRoom = useMutation({
    mutationFn: async (payload: { name: string; budget?: number; currency?: string }) =>
      (await api.post<RoomDetail>('/api/rooms', payload)).data,
    onSuccess: () => {
      toast.success('Room created');
      setName('');
      setBudget('');
      void qc.invalidateQueries({ queryKey: ['rooms'] });
      // The room.created notification is produced async (santa-api → RabbitMQ →
      // consumer). Refetch notifications shortly after so the bell updates without
      // waiting for the 5s poll. (Truly instant push is the WebSocket — Lesson 08.)
      setTimeout(() => qc.invalidateQueries({ queryKey: ['notifications'] }), 1500);
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Could not create room')),
  });

  const joinRoom = useMutation({
    mutationFn: async () =>
      (await api.post('/api/rooms/join', { inviteCode: joinCode })).data,
    onSuccess: () => {
      toast.success('Joined room');
      setJoinCode('');
      void qc.invalidateQueries({ queryKey: ['rooms'] });
      setTimeout(() => qc.invalidateQueries({ queryKey: ['notifications'] }), 1500);
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Could not join')),
  });

  const rooms = data?.data ?? [];

  return (
    <div className="relative">
      {/* Decorative frost scatter (see public/decor) — purely cosmetic. */}
      <img
        src="/decor/snowflake.svg"
        alt=""
        aria-hidden
        className="pointer-events-none absolute -right-2 -top-4 -z-10 size-16 opacity-40"
      />
      <img
        src="/decor/snowflake.svg"
        alt=""
        aria-hidden
        className="pointer-events-none absolute right-1/3 top-24 -z-10 size-10 opacity-25"
      />
      <img
        src="/decor/snowflake.svg"
        alt=""
        aria-hidden
        className="pointer-events-none absolute -left-3 top-64 -z-10 size-12 opacity-30"
      />
      <PageHeader title="Your rooms" description="Rooms you created or joined." />

      <div className="mb-6 grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Create a room</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-3"
              onSubmit={(e: FormEvent) => {
                e.preventDefault();
                if (!name.trim()) return;
                const amount = budget.trim() ? Number(budget) : undefined;
                createRoom.mutate({
                  name: name.trim(),
                  ...(amount ? { budget: amount, currency } : {}),
                });
              }}
            >
              <Input
                placeholder="Room name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">
                  Gift budget per person (optional)
                </Label>
                <div className="flex gap-2">
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="rounded-md border border-border bg-transparent px-2 text-sm"
                    aria-label="Currency"
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
                    placeholder="e.g. 500"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                  />
                </div>
              </div>
              <Button type="submit" disabled={createRoom.isPending} className="w-full">
                <Plus /> Create
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Join with an invite</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="flex gap-2"
              onSubmit={(e: FormEvent) => {
                e.preventDefault();
                if (joinCode.trim()) joinRoom.mutate();
              }}
            >
              <Input
                placeholder="Invite code"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
              />
              <Button type="submit" variant="outline" disabled={joinRoom.isPending}>
                Join
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading rooms…</p>
      ) : rooms.length === 0 ? (
        <EmptyState
          icon={Gift}
          title="No rooms yet"
          description="Create your first Secret Santa room above, or join one with an invite code."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rooms.map((room) => (
            <Link key={room.id} to={`/rooms/${room.id}`}>
              <Card className="transition hover:border-primary">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between text-base">
                    {room.name}
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      {room.status}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Users className="size-4" /> {room.participantCount} participant
                    {room.participantCount === 1 ? '' : 's'}
                  </span>
                  {room.budget ? (
                    <span className="flex items-center gap-1 font-medium text-primary">
                      <Wallet className="size-4" /> {room.currency ?? ''}{room.budget}
                    </span>
                  ) : null}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
