import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { DayPicker } from 'react-day-picker';
import { format } from 'date-fns';
import {
  Gift,
  Users,
  Copy,
  Check,
  Calendar as CalendarIcon,
  Plus,
  Trash2,
  Sparkles,
  AlertCircle,
  Pencil,
} from 'lucide-react';
import { toast } from 'sonner';
import { api, getApiErrorMessage } from '@/lib/api';
import { useAuth } from '@/features/auth/useAuth';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import type { RoomDetail, Assignment, Wishlist } from '@/types/api';

export function RoomDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const [room, setRoom] = useState<RoomDetail | null>(null);
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [newItem, setNewItem] = useState('');
  const [savingWishlist, setSavingWishlist] = useState(false);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState(false);

  // Draw Dialog state
  const [drawDialogOpen, setDrawDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [drawing, setDrawing] = useState(false);

  // Change Date Dialog state (owner edit)
  const [changeDateDialogOpen, setChangeDateDialogOpen] = useState(false);
  const [newExchangeDate, setNewExchangeDate] = useState<Date | undefined>(undefined);
  const [changingDate, setChangingDate] = useState(false);

  // Fetch Room Data
  const fetchRoom = useCallback(async () => {
    if (!id) return;
    try {
      const { data } = await api.get<RoomDetail>(`/api/rooms/${id}`);
      setRoom(data);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to load room details'));
    }
  }, [id]);

  // Fetch User's Assignment
  const fetchAssignment = useCallback(async () => {
    if (!id) return;
    try {
      const { data } = await api.get<Assignment>(`/api/rooms/${id}/assignment`);
      setAssignment(data);
    } catch {
      setAssignment(null);
    }
  }, [id]);

  // Fetch Current User's Wishlist
  const fetchWishlist = useCallback(async () => {
    if (!id || !user) return;
    try {
      const { data } = await api.get<Wishlist>(`/api/rooms/${id}/wishlist/${user.id}`);
      setWishlist(data.items ?? []);
    } catch {
      setWishlist([]);
    }
  }, [id, user]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    await fetchRoom();
    await fetchWishlist();
    setLoading(false);
  }, [fetchRoom, fetchWishlist]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  useEffect(() => {
    if (room?.status === 'drawn') {
      void fetchAssignment();
    }
  }, [room?.status, fetchAssignment]);

  // Handle Copy Invite Code
  const handleCopyInviteCode = () => {
    if (!room) return;
    void navigator.clipboard.writeText(room.inviteCode);
    setCopiedCode(true);
    toast.success('Invite code copied to clipboard!');
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Wishlist actions (Instant Auto-Save)
  const saveWishlistBackend = async (newItems: string[]) => {
    if (!id) return;
    setSavingWishlist(true);
    try {
      await api.put(`/api/rooms/${id}/wishlist`, { items: newItems });
      setWishlist(newItems);
      toast.success('Wishlist updated!');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to update wishlist'));
      void fetchWishlist();
    } finally {
      setSavingWishlist(false);
    }
  };

  const handleAddWishlistItem = async (e: React.FormEvent) => {
    e.preventDefault();
    const item = newItem.trim();
    if (!item) return;
    setNewItem('');
    const updated = [...wishlist, item];
    await saveWishlistBackend(updated);
  };

  const handleRemoveWishlistItem = async (index: number) => {
    const updated = wishlist.filter((_, i) => i !== index);
    await saveWishlistBackend(updated);
  };

  // Draw action
  const handleConfirmDraw = async () => {
    if (!id || !selectedDate) return;
    setDrawing(true);
    try {
      const exchangeDateIso = selectedDate.toISOString();
      await api.post(`/api/rooms/${id}/draw`, { exchangeDate: exchangeDateIso });
      toast.success('Draw completed! Assignments generated.');
      setDrawDialogOpen(false);
      await fetchRoom();
      await fetchAssignment();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to trigger draw'));
    } finally {
      setDrawing(false);
    }
  };

  // Change exchange date action
  const handleChangeExchangeDate = async () => {
    if (!id || !newExchangeDate) return;
    setChangingDate(true);
    try {
      await api.patch(`/api/rooms/${id}`, { exchangeDate: newExchangeDate.toISOString() });
      toast.success('Gift exchange date updated!');
      setChangeDateDialogOpen(false);
      await fetchRoom();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to update exchange date'));
    } finally {
      setChangingDate(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-muted-foreground">Loading room details…</p>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="flex h-64 flex-col items-center justify-center space-y-4">
        <AlertCircle className="size-12 text-destructive" />
        <p className="text-lg font-medium">Room not found</p>
      </div>
    );
  }

  const isCreator = user?.id === room.creatorId;
  const canDraw = isCreator && room.status !== 'drawn' && room.participantCount >= 3;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title={room.name}
        description={
          room.exchangeDate
            ? `Gift exchange date: ${format(new Date(room.exchangeDate), 'MMMM d, yyyy')}`
            : 'Secret Santa Room'
        }
        action={
          isCreator && (
            <Button
              onClick={() => setDrawDialogOpen(true)}
              disabled={!canDraw}
              className="gap-2"
            >
              <Sparkles className="size-4" />
              {room.status === 'drawn' ? 'Draw completed' : 'Draw names'}
            </Button>
          )
        }
      />

      {/* Main Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Left Column: Room Info + Participants */}
        <div className="space-y-6">
          {/* Room Summary Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Gift className="size-5 text-primary" /> Room Info
                </CardTitle>
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    room.status === 'drawn'
                      ? 'bg-green-100 text-secondary'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {room.status === 'drawn' ? 'Drawn' : 'Pending Draw'}
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-3">
                <div className="space-y-0.5">
                  <p className="text-xs text-muted-foreground">Invite Code</p>
                  <p className="font-mono text-lg font-bold tracking-widest">
                    {room.inviteCode}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCopyInviteCode}
                  className="gap-1.5"
                >
                  {copiedCode ? <Check className="size-4 text-green-600" /> : <Copy className="size-4" />}
                  {copiedCode ? 'Copied' : 'Copy'}
                </Button>
              </div>

              {room.exchangeDate && (
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="size-4 text-primary" />
                    <span>
                      Exchange date:{' '}
                      <strong className="text-foreground">
                        {format(new Date(room.exchangeDate), 'EEE, d MMM yyyy')}
                      </strong>
                    </span>
                  </div>
                  {isCreator && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setNewExchangeDate(new Date(room.exchangeDate!));
                        setChangeDateDialogOpen(true);
                      }}
                      className="h-7 gap-1 text-xs text-muted-foreground hover:text-foreground"
                    >
                      <Pencil className="size-3.5" /> Change
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Participants Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Users className="size-5 text-primary" /> Participants
                </span>
                <span className="text-sm font-normal text-muted-foreground">
                  {room.participantCount} member{room.participantCount !== 1 ? 's' : ''}
                </span>
              </CardTitle>
              {room.participantCount < 3 && room.status !== 'drawn' && (
                <CardDescription className="text-amber-600">
                  ⚠️ At least 3 participants are required to trigger the draw.
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <div className="divide-y rounded-md border">
                {room.participants.map((participant) => (
                  <div
                    key={participant.id}
                    className="flex items-center justify-between p-3"
                  >
                    <div className="flex items-center gap-2">
                      <div className="flex size-8 items-center justify-center rounded-full bg-primary-soft text-sm font-semibold text-primary">
                        {participant.displayName.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium">{participant.displayName}</span>
                      {participant.id === user?.id && (
                        <span className="text-xs text-muted-foreground">(You)</span>
                      )}
                    </div>
                    {participant.role === 'owner' && (
                      <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                        Owner
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Assignment + Wishlist */}
        <div className="space-y-6">
          {/* Assignment Banner (if drawn) */}
          {room.status === 'drawn' && assignment && (
            <Card className="border-secondary/40 bg-secondary/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-secondary">
                  <Sparkles className="size-5" /> Your Secret Santa Assignment
                </CardTitle>
                <CardDescription>
                  Keep it a secret! Here is who you are giving a gift to.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg bg-card p-4 border text-center">
                  <p className="text-sm text-muted-foreground">You are giving a gift to</p>
                  <p className="mt-1 text-2xl font-bold text-primary">
                    {assignment.receiver.displayName}
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-semibold">
                    {assignment.receiver.displayName}’s Wishlist:
                  </p>
                  {assignment.receiver.wishlist.length > 0 ? (
                    <ul className="space-y-1.5 rounded-md border bg-card p-3">
                      {assignment.receiver.wishlist.map((item, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-sm">
                          <span className="size-1.5 rounded-full bg-primary" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">
                      {assignment.receiver.displayName} hasn’t added any items to their wishlist yet.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Your Wishlist Editor */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="size-5 text-primary" /> Your Wishlist
              </CardTitle>
              <CardDescription>
                Add items you would love to receive from your Secret Santa.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleAddWishlistItem} className="flex gap-2">
                <Input
                  placeholder="Add an item (e.g. Book XYZ, Coffee beans)"
                  value={newItem}
                  onChange={(e) => setNewItem(e.target.value)}
                  disabled={savingWishlist}
                />
                <Button
                  type="submit"
                  variant="secondary"
                  size="icon"
                  disabled={savingWishlist || !newItem.trim()}
                >
                  <Plus className="size-4" />
                </Button>
              </form>

              {wishlist.length > 0 ? (
                <ul className="space-y-2">
                  {wishlist.map((item, index) => (
                    <li
                      key={index}
                      className="flex items-center justify-between rounded-md border bg-muted/20 p-2 text-sm"
                    >
                      <span>{item}</span>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleRemoveWishlistItem(index)}
                        disabled={savingWishlist}
                        className="size-7 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground italic text-center py-2">
                  Your wishlist is empty. Add a few items!
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Draw Dialog with Inline Calendar */}
      <Dialog open={drawDialogOpen} onOpenChange={setDrawDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="size-5 text-primary" /> Secret Santa Draw
            </DialogTitle>
            <DialogDescription>
              Pick the gift-exchange date to trigger the draw. Every participant will be randomly assigned their target.
            </DialogDescription>
          </DialogHeader>

          <div className="py-2">
            <DayPicker
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              weekStartsOn={1}
              disabled={{ before: today }}
              className="santa-cal mx-auto"
            />

            <div className="mt-4 rounded-lg bg-primary-soft p-3 text-center">
              <p className="text-xs text-muted-foreground">Chosen Gift Exchange Date</p>
              <p className="text-sm font-semibold text-primary">
                {selectedDate
                  ? format(selectedDate, 'EEEE, MMMM d, yyyy')
                  : 'Please pick a date on the calendar above'}
              </p>
            </div>
          </div>

          <DialogFooter className="sm:justify-between">
            <Button
              variant="outline"
              onClick={() => setDrawDialogOpen(false)}
              disabled={drawing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmDraw}
              disabled={!selectedDate || drawing}
              className="gap-2"
            >
              {drawing ? 'Drawing names…' : 'Confirm Draw'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Exchange Date Dialog (Owner Only) */}
      <Dialog open={changeDateDialogOpen} onOpenChange={setChangeDateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarIcon className="size-5 text-primary" /> Change Exchange Date
            </DialogTitle>
            <DialogDescription>
              Select a new date for the Secret Santa gift exchange.
            </DialogDescription>
          </DialogHeader>

          <div className="py-2">
            <DayPicker
              mode="single"
              selected={newExchangeDate}
              onSelect={setNewExchangeDate}
              weekStartsOn={1}
              disabled={{ before: today }}
              className="santa-cal mx-auto"
            />

            <div className="mt-4 rounded-lg bg-primary-soft p-3 text-center">
              <p className="text-xs text-muted-foreground">New Exchange Date</p>
              <p className="text-sm font-semibold text-primary">
                {newExchangeDate
                  ? format(newExchangeDate, 'EEEE, MMMM d, yyyy')
                  : 'Please pick a date on the calendar above'}
              </p>
            </div>
          </div>

          <DialogFooter className="sm:justify-between">
            <Button
              variant="outline"
              onClick={() => setChangeDateDialogOpen(false)}
              disabled={changingDate}
            >
              Cancel
            </Button>
            <Button
              onClick={handleChangeExchangeDate}
              disabled={!newExchangeDate || changingDate}
            >
              {changingDate ? 'Updating…' : 'Save Date'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
