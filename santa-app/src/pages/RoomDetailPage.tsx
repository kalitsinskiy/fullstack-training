import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarDays, Dices, Gift, MessageCircle, RefreshCw, Trash2, UserMinus, Wallet } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { api, getApiErrorMessage } from '@/lib/api';
import { useAuth } from '@/features/auth/useAuth';
import { usePermissions } from '@/features/rooms/usePermissions';
import { useSocket } from '@/features/realtime/useSocket';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import type { Assignment, RoomDetail, Wishlist } from '@/types/api';

export function RoomDetailPage() {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user } = useAuth();

  const roomQuery = useQuery({
    queryKey: ['room', id],
    queryFn: async () => (await api.get<RoomDetail>(`/api/rooms/${id}`)).data,
    retry: false,
  });
  const room = roomQuery.data;
  const { can } = usePermissions(room);
  const socket = useSocket();

  // Live room updates: join the room channel and refetch when members change /
  // the draw happens, so this page updates without a manual refresh.
  useEffect(() => {
    if (!socket || !id) return;
    socket.emit('join-room', id);
    const refetch = () => void qc.invalidateQueries({ queryKey: ['room', id] });
    socket.on('room:member-joined', refetch);
    socket.on('room:draw-completed', refetch);
    socket.on('room:updated', refetch);
    return () => {
      socket.emit('leave-room', id);
      socket.off('room:member-joined', refetch);
      socket.off('room:draw-completed', refetch);
      socket.off('room:updated', refetch);
    };
  }, [socket, id, qc]);

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ['room', id] });
    void qc.invalidateQueries({ queryKey: ['rooms'] });
  };

  const mutate = (fn: () => Promise<unknown>, ok: string, fail: string) =>
    fn()
      .then(() => {
        toast.success(ok);
        invalidate();
      })
      .catch((e) => toast.error(getApiErrorMessage(e, fail)));

  // Draw opens a dialog where the owner picks the gift-exchange date (required).
  const [drawOpen, setDrawOpen] = useState(false);
  const [drawDate, setDrawDate] = useState<Date | undefined>();
  const [editOpen, setEditOpen] = useState(false);

  const draw = useMutation({
    mutationFn: (date: Date) =>
      api.post(`/api/rooms/${id}/draw`, { exchangeDate: date.toISOString() }),
    onSuccess: () => {
      toast.success('The draw is done!');
      setDrawOpen(false);
      invalidate();
      setTimeout(() => qc.invalidateQueries({ queryKey: ['notifications'] }), 1500);
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Draw failed')),
  });

  // Owner can change the exchange date after the draw.
  const updateDate = useMutation({
    mutationFn: (date: Date) =>
      api.patch(`/api/rooms/${id}`, { exchangeDate: date.toISOString() }),
    onSuccess: () => {
      toast.success('Exchange date updated');
      invalidate();
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Could not update date')),
  });

  // --- wishlist (mine) ---
  const [items, setItems] = useState('');
  const wishlistQuery = useQuery({
    queryKey: ['wishlist', id, user?.id],
    enabled: !!user?.id && !!room,
    queryFn: async () =>
      (await api.get<Wishlist>(`/api/rooms/${id}/wishlist/${user!.id}`)).data,
  });
  useEffect(() => {
    if (wishlistQuery.data) setItems(wishlistQuery.data.items.join('\n'));
  }, [wishlistQuery.data]);

  const saveWishlist = useMutation({
    mutationFn: () =>
      api.put(`/api/rooms/${id}/wishlist`, {
        items: items.split('\n').map((s) => s.trim()).filter(Boolean),
      }),
    onSuccess: () => toast.success('Wishlist saved'),
    onError: (e) => toast.error(getApiErrorMessage(e, 'Could not save wishlist')),
  });

  // --- my assignment (after draw) ---
  const assignmentQuery = useQuery({
    queryKey: ['assignment', id],
    enabled: room?.status === 'drawn',
    queryFn: async () =>
      (await api.get<Assignment>(`/api/rooms/${id}/assignment`)).data,
    retry: false,
  });

  if (roomQuery.isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (roomQuery.isError || !room)
    return (
      <PageHeader
        title="Room not found"
        description="It doesn't exist, or you're not a participant."
      />
    );

  return (
    <>
      <PageHeader
        title={room.name}
        description={`Status: ${room.status} · ${room.participantCount} participants`}
        action={
          can('room:draw') && room.status === 'pending' ? (
            <Dialog open={drawOpen} onOpenChange={setDrawOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Dices /> Draw names
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Run the draw</DialogTitle>
                  <DialogDescription>
                    Pick the day everyone exchanges gifts. Names are drawn and the date
                    is shared with all participants (you can change it later).
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-1.5">
                  <Label>
                    Gift-exchange date
                    {drawDate && (
                      <span className="ml-2 font-normal text-primary">
                        {format(drawDate, 'EEE, d MMM yyyy')}
                      </span>
                    )}
                  </Label>
                  <Calendar selected={drawDate} onSelect={setDrawDate} />
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">Cancel</Button>
                  </DialogClose>
                  <Button
                    disabled={!drawDate || draw.isPending}
                    onClick={() => drawDate && draw.mutate(drawDate)}
                  >
                    <Dices /> Draw names
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          ) : null
        }
      />

      {room.budget ? (
        <div className="-mt-3 mb-6 flex items-center gap-2 rounded-lg border border-primary/20 bg-primary-soft px-4 py-2.5 text-primary">
          <Wallet className="size-5" />
          <span className="text-base font-semibold">
            Gift budget: {room.currency ?? ''}{room.budget} per person
          </span>
        </div>
      ) : null}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Participants */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Participants</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {room.participants.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm"
              >
                <span>
                  {p.displayName}
                  <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                    {p.role}
                  </span>
                </span>
                {can('room:kick') && p.role !== 'owner' && p.id !== user?.id && (
                  <Button
                    variant="outline"
                    onClick={() =>
                      void mutate(
                        () => api.delete(`/api/rooms/${id}/members/${p.id}`),
                        'Member removed',
                        'Could not remove',
                      )
                    }
                  >
                    <UserMinus /> Kick
                  </Button>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Invite + owner actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Invite & settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <Label>Invite code</Label>
              <div className="mt-1 flex gap-2">
                <Input readOnly value={room.inviteCode} className="font-mono" />
                {can('room:invite') && (
                  <Button
                    variant="outline"
                    onClick={() =>
                      void mutate(
                        () => api.post(`/api/rooms/${id}/invite-code/regenerate`),
                        'New code generated',
                        'Could not regenerate',
                      )
                    }
                  >
                    <RefreshCw /> New
                  </Button>
                )}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Share this room's <strong>ID</strong> ({id}) and code so others can join.
              </p>
            </div>
            {room.status === 'drawn' && (
              <div>
                <Label>Gift exchange</Label>
                <div className="mt-1 flex items-center gap-2">
                  <CalendarDays className="size-4 text-primary" />
                  <span className="font-medium">
                    {room.exchangeDate
                      ? format(new Date(room.exchangeDate), 'EEEE, d MMM yyyy')
                      : 'Not set'}
                  </span>
                </div>
                {can('room:edit') && (
                  <Dialog open={editOpen} onOpenChange={setEditOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="mt-2">
                        <CalendarDays /> Change date
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Change exchange date</DialogTitle>
                        <DialogDescription>
                          Pick a new gift-exchange day — all participants will see it.
                        </DialogDescription>
                      </DialogHeader>
                      <Calendar
                        selected={room.exchangeDate ? new Date(room.exchangeDate) : undefined}
                        onSelect={(d) => {
                          if (d) {
                            updateDate.mutate(d);
                            setEditOpen(false);
                          }
                        }}
                      />
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            )}
            {can('room:delete') && (
              <Button
                variant="outline"
                onClick={() =>
                  void api
                    .delete(`/api/rooms/${id}`)
                    .then(() => {
                      toast.success('Room deleted');
                      void qc.invalidateQueries({ queryKey: ['rooms'] });
                      navigate('/rooms');
                    })
                    .catch((e) => toast.error(getApiErrorMessage(e, 'Could not delete')))
                }
              >
                <Trash2 /> Delete room
              </Button>
            )}
          </CardContent>
        </Card>

        {/* My wishlist */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Your wishlist</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <textarea
              className="min-h-28 w-full rounded-md border border-border bg-transparent p-2 text-sm"
              placeholder="One gift idea per line"
              value={items}
              onChange={(e) => setItems(e.target.value)}
            />
            <Button onClick={() => saveWishlist.mutate()} disabled={saveWishlist.isPending}>
              Save wishlist
            </Button>
          </CardContent>
        </Card>

        {/* My assignment */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Gift className="size-4 text-primary" /> Your giftee
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            {room.status !== 'drawn' ? (
              <p className="text-muted-foreground">Revealed after the draw.</p>
            ) : assignmentQuery.data ? (
              <div className="space-y-2">
                <p>
                  You're gifting{' '}
                  <strong className="text-primary">
                    {assignmentQuery.data.receiver.displayName}
                  </strong>
                </p>
                <div>
                  <Label>Their wishlist</Label>
                  {assignmentQuery.data.receiver.wishlist.length ? (
                    <ul className="mt-1 list-inside list-disc text-muted-foreground">
                      {assignmentQuery.data.receiver.wishlist.map((w, i) => (
                        <li key={i}>{w}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-1 text-muted-foreground">No wishlist yet.</p>
                  )}
                </div>
                <Button variant="outline" asChild>
                  <Link to={`/rooms/${id}/messages`}>
                    <MessageCircle /> Send an anonymous message
                  </Link>
                </Button>
              </div>
            ) : (
              <p className="text-muted-foreground">Loading your assignment…</p>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
