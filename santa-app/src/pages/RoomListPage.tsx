import { useEffect, useState, useCallback, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Gift, Plus, Users, ArrowRight, KeyRound } from 'lucide-react';
import { toast } from 'sonner';
import { api, getApiErrorMessage } from '@/lib/api';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/EmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import type { RoomSummary } from '@/types/api';

export function RoomListPage() {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<RoomSummary[]>([]);
  const [loading, setLoading] = useState(true);

  // Create Room modal state
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState('');
  const [budget, setBudget] = useState<string>('');
  const [currency, setCurrency] = useState('$');
  const [creating, setCreating] = useState(false);

  // Join Room modal state
  const [joinOpen, setJoinOpen] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [joining, setJoining] = useState(false);

  const fetchRooms = useCallback(async () => {
    try {
      const { data } = await api.get<{ data: RoomSummary[] }>('/api/rooms');
      setRooms(data.data ?? []);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to load rooms'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchRooms();
  }, [fetchRooms]);

  const handleCreateRoom = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    try {
      const payload: { name: string; budget?: number; currency?: string } = {
        name: name.trim(),
      };
      if (budget) {
        payload.budget = Number(budget);
        payload.currency = currency;
      }

      const { data } = await api.post<{ id: string }>('/api/rooms', payload);
      toast.success('Room created successfully!');
      setCreateOpen(false);
      setName('');
      setBudget('');
      navigate(`/rooms/${data.id}`);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to create room'));
    } finally {
      setCreating(false);
    }
  };

  const handleJoinRoom = async (e: FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) return;
    setJoining(true);
    try {
      const { data } = await api.post<{ id: string }>('/api/rooms/join', {
        inviteCode: inviteCode.trim(),
      });
      toast.success('Joined room successfully!');
      setJoinOpen(false);
      setInviteCode('');
      navigate(`/rooms/${data.id}`);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to join room. Check invite code.'));
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-muted-foreground">Loading your rooms…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Your rooms"
        description="Rooms you created or joined."
        action={
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={(e) => {
                e.preventDefault();
                setJoinOpen(true);
              }}
              className="gap-2"
            >
              <KeyRound className="size-4" /> Join with code
            </Button>
            <Button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                setCreateOpen(true);
              }}
              className="gap-2"
            >
              <Plus className="size-4" /> New room
            </Button>
          </div>
        }
      />

      {rooms.length === 0 ? (
        <EmptyState
          icon={Gift}
          title="No rooms yet"
          description="Create your first Secret Santa room or join one with an invite code."
          action={
            <div className="flex gap-2">
              <Button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setCreateOpen(true);
                }}
                className="gap-2"
              >
                <Plus className="size-4" /> Create a room
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={(e) => {
                  e.preventDefault();
                  setJoinOpen(true);
                }}
                className="gap-2"
              >
                <KeyRound className="size-4" /> Join with code
              </Button>
            </div>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rooms.map((room) => (
            <Card
              key={room.id}
              className="cursor-pointer transition-all hover:border-primary/50 hover:shadow-md"
              onClick={() => navigate(`/rooms/${room.id}`)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg font-bold">{room.name}</CardTitle>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      room.status === 'drawn'
                        ? 'bg-green-100 text-secondary'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {room.status === 'drawn' ? 'Drawn' : 'Pending'}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="flex items-center justify-between pt-0 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Users className="size-4" />
                  {room.participantCount} participant{room.participantCount !== 1 ? 's' : ''}
                </span>
                <span className="flex items-center gap-1 font-medium text-primary hover:underline">
                  View room <ArrowRight className="size-4" />
                </span>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Room Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gift className="size-5 text-primary" /> Create Secret Santa Room
            </DialogTitle>
            <DialogDescription>
              Set a name and optional budget for your Secret Santa party.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateRoom} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="room-name">Room Name</Label>
              <Input
                id="room-name"
                placeholder="e.g. Office Party 2026, Family Secret Santa"
                value={name}
                onChange={(e) => setName(e.target.value)}
                minLength={3}
                maxLength={60}
                required
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2 space-y-2">
                <Label htmlFor="budget">Budget (Optional)</Label>
                <Input
                  id="budget"
                  type="number"
                  placeholder="e.g. 50"
                  min={1}
                  max={1000000}
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <select
                  id="currency"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                >
                  <option value="$">$ (USD)</option>
                  <option value="€">€ (EUR)</option>
                  <option value="£">£ (GBP)</option>
                  <option value="₴">₴ (UAH)</option>
                  <option value="zł">zł (PLN)</option>
                </select>
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateOpen(false)}
                disabled={creating}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={creating || !name.trim()}>
                {creating ? 'Creating…' : 'Create Room'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Join Room Dialog */}
      <Dialog open={joinOpen} onOpenChange={setJoinOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="size-5 text-primary" /> Join Room with Invite Code
            </DialogTitle>
            <DialogDescription>
              Enter the 6-character invite code provided by the room owner.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleJoinRoom} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="invite-code">Invite Code</Label>
              <Input
                id="invite-code"
                placeholder="e.g. EFvdtS"
                className="font-mono text-center text-lg tracking-widest"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                required
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setJoinOpen(false)}
                disabled={joining}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={joining || !inviteCode.trim()}>
                {joining ? 'Joining…' : 'Join Room'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
