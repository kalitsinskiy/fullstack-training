import { useState, type FormEvent } from 'react';
import { Gift, Plus } from 'lucide-react';
import { toast } from 'sonner';
import {
  useCreateRoom,
  useJoinRoom,
  useRooms,
  type CreateRoomInput,
} from '@/features/rooms/api';
import { getApiErrorMessage } from '@/lib/api';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/EmptyState';
import { RoomCard } from '@/components/RoomCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const CURRENCIES = ['$', '€', '£', '₴', 'zł'] as const;

export function RoomListPage() {
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const roomsQuery = useRooms(page);

  const rooms = roomsQuery.data?.data ?? [];
  const totalPages = roomsQuery.data?.meta.totalPages ?? 1;

  return (
    <>
      <PageHeader
        title="Your rooms"
        description="Rooms you created or joined."
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setJoinOpen(true)}>
              Join with code
            </Button>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus /> New room
            </Button>
          </div>
        }
      />

      {roomsQuery.isLoading && (
        <p className="text-sm text-muted-foreground">Loading your rooms…</p>
      )}

      {roomsQuery.isError && (
        <div className="flex flex-col items-start gap-3 rounded-lg border border-destructive/40 bg-destructive/5 p-4">
          <p className="text-sm text-destructive">
            {getApiErrorMessage(roomsQuery.error, 'Could not load your rooms')}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void roomsQuery.refetch()}
          >
            Try again
          </Button>
        </div>
      )}

      {roomsQuery.isSuccess && rooms.length === 0 && (
        <EmptyState
          icon={Gift}
          title="No rooms yet"
          description="Create your first Secret Santa room or join one with an invite code."
          action={
            <div className="flex gap-2">
              <Button onClick={() => setCreateOpen(true)}>
                <Plus /> Create a room
              </Button>
              <Button variant="outline" onClick={() => setJoinOpen(true)}>
                Join with code
              </Button>
            </div>
          }
        />
      )}

      {roomsQuery.isSuccess && rooms.length > 0 && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rooms.map((room) => (
              <RoomCard key={room.id} room={room} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-4">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}

      <CreateRoomDialog open={createOpen} onOpenChange={setCreateOpen} />
      <JoinRoomDialog open={joinOpen} onOpenChange={setJoinOpen} />
    </>
  );
}

function CreateRoomDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [name, setName] = useState('');
  const [budget, setBudget] = useState('');
  const [currency, setCurrency] = useState<string>(CURRENCIES[0]);
  const createRoom = useCreateRoom();

  function reset() {
    setName('');
    setBudget('');
    setCurrency(CURRENCIES[0]);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const input: CreateRoomInput = { name: name.trim() };
    const budgetValue = Number(budget);
    if (budget.trim() && Number.isFinite(budgetValue) && budgetValue > 0) {
      input.budget = budgetValue;
      input.currency = currency;
    }
    createRoom.mutate(input, {
      onSuccess: (room) => {
        toast.success(`Room “${room.name}” created`);
        reset();
        onOpenChange(false);
      },
      onError: (error) =>
        toast.error(getApiErrorMessage(error, 'Could not create the room')),
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a room</DialogTitle>
          <DialogDescription>
            Name your Secret Santa room. You can set an optional per-gift
            budget.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="room-name">Room name</Label>
            <Input
              id="room-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="New Year team building"
              minLength={3}
              maxLength={60}
              required
              autoFocus
            />
          </div>
          <div className="grid grid-cols-[1fr_auto] gap-2">
            <div className="space-y-2">
              <Label htmlFor="room-budget">Budget (optional)</Label>
              <Input
                id="room-budget"
                type="number"
                min={1}
                max={1_000_000}
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="room-currency">Currency</Label>
              <select
                id="room-currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={name.trim().length < 3 || createRoom.isPending}
            >
              {createRoom.isPending ? 'Creating…' : 'Create room'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function JoinRoomDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [inviteCode, setInviteCode] = useState('');
  const joinRoom = useJoinRoom();

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    joinRoom.mutate(inviteCode.trim(), {
      onSuccess: (room) => {
        toast.success(`Joined “${room.name}”`);
        setInviteCode('');
        onOpenChange(false);
      },
      onError: (error) =>
        toast.error(getApiErrorMessage(error, 'Could not join the room')),
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Join with a code</DialogTitle>
          <DialogDescription>
            Enter the invite code someone shared with you.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="invite-code">Invite code</Label>
            <Input
              id="invite-code"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              placeholder="Q7X4LM"
              className="font-mono tracking-widest"
              autoFocus
              required
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!inviteCode.trim() || joinRoom.isPending}
            >
              {joinRoom.isPending ? 'Joining…' : 'Join room'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
