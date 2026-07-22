import 'react-day-picker/style.css';
import { useState, useEffect, type FormEvent } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { DayPicker } from 'react-day-picker';
import { Gift, CalendarDays, RefreshCw, Trash2 } from 'lucide-react';
import { api, getApiErrorMessage } from '@/lib/api';
import { useAuth } from '@/features/auth/useAuth';
import { usePermissions } from '@/features/rooms/usePermissions';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useSocket } from '@/hooks/useSocket';
import type { RoomDetail, Wishlist, Assignment } from '@/types/api';

export function RoomDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [wishlistInput, setWishlistInput] = useState('');
  const [drawDialogOpen, setDrawDialogOpen] = useState(false);
  const [exchangeDate, setExchangeDate] = useState<Date | undefined>(undefined);
  const [changeDateOpen, setChangeDateOpen] = useState(false);
  const [changeDate, setChangeDate] = useState<Date | undefined>(undefined);

  const { socket, joinRoom, leaveRoom } = useSocket();

  useEffect(() => {
    if (!socket || !id) return;
    joinRoom(id);

    const refetchRoom = () => {
      void queryClient.invalidateQueries({ queryKey: ['rooms', id] });
      void queryClient.invalidateQueries({
        queryKey: ['rooms', id, 'assignment'],
      });
    };

    socket.on('room:member-joined', refetchRoom);
    socket.on('room:draw-completed', refetchRoom);

    return () => {
      leaveRoom(id);
      socket.off('room:member-joined', refetchRoom);
      socket.off('room:draw-completed', refetchRoom);
    };
  }, [socket, id, joinRoom, leaveRoom, queryClient]);

  const { data: room, isLoading: roomLoading } = useQuery<RoomDetail>({
    queryKey: ['rooms', id],
    queryFn: async () => {
      const { data } = await api.get<RoomDetail>(`/api/rooms/${id}`);
      return data;
    },
    enabled: !!id,
  });

  const { can } = usePermissions(room);

  const { data: wishlist } = useQuery<Wishlist>({
    queryKey: ['rooms', id, 'wishlist', user?.id],
    queryFn: async () => {
      const { data } = await api.get<Wishlist>(
        `/api/rooms/${id}/wishlist/${user!.id}`,
      );
      return data;
    },
    enabled: !!id && !!user?.id,
  });

  const { data: assignment } = useQuery<Assignment>({
    queryKey: ['rooms', id, 'assignment'],
    queryFn: async () => {
      const { data } = await api.get<Assignment>(`/api/rooms/${id}/assignment`);
      return data;
    },
    enabled: !!id && room?.status === 'drawn',
  });

  const updateWishlistMutation = useMutation({
    mutationFn: async (items: string[]) => {
      await api.put(`/api/rooms/${id}/wishlist`, { items });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms', id, 'wishlist'] });
      toast.success('Wishlist updated');
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'Failed to update wishlist'));
    },
  });

  const drawMutation = useMutation({
    mutationFn: async (date: string) => {
      if (!can('room:draw')) return;
      await api.post(`/api/rooms/${id}/draw`, { exchangeDate: date });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms', id] });
      queryClient.invalidateQueries({ queryKey: ['rooms', id, 'assignment'] });
      setDrawDialogOpen(false);
      setExchangeDate(undefined);
      toast.success('Names have been drawn!');
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'Failed to draw names'));
    },
  });

  const changeDateMutation = useMutation({
    mutationFn: async (date: string) => {
      if (!can('room:edit')) return;
      await api.patch(`/api/rooms/${id}`, { exchangeDate: date });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms', id] });
      setChangeDateOpen(false);
      setChangeDate(undefined);
      toast.success('Exchange date updated');
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'Failed to update date'));
    },
  });

  const kickMutation = useMutation({
    mutationFn: async (memberId: string) => {
      if (!can('room:kick')) return;
      await api.delete(`/api/rooms/${id}/members/${memberId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms', id] });
      toast.success('Member removed');
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'Failed to remove member'));
    },
  });

  const regenerateCodeMutation = useMutation({
    mutationFn: async () => {
      if (!can('room:invite')) return;
      await api.post(`/api/rooms/${id}/invite-code/regenerate`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms', id] });
      toast.success('Invite code regenerated');
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'Failed to regenerate code'));
    },
  });

  const deleteRoomMutation = useMutation({
    mutationFn: async () => {
      if (!can('room:delete')) return;
      await api.delete(`/api/rooms/${id}`);
    },
    onSuccess: () => {
      toast.success('Room deleted');
      window.history.back();
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'Failed to delete room'));
    },
  });

  function handleWishlistSubmit(e: FormEvent) {
    e.preventDefault();
    const items = wishlistInput
      .split('\n')
      .map((item) => item.trim())
      .filter(Boolean);
    updateWishlistMutation.mutate(items);
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (roomLoading) {
    return <PageHeader title="Room" description="Loading..." />;
  }

  if (!room) {
    return <PageHeader title="Room" description="Room not found." />;
  }

  const canDraw =
    can('room:draw') && room.status === 'pending' && room.participantCount >= 3;
  const drawDisabledReason =
    room.status === 'drawn'
      ? 'Draw already performed'
      : room.participantCount < 3
        ? 'Need at least 3 participants'
        : undefined;

  return (
    <>
      <PageHeader
        title={room.name}
        description={`Status: ${room.status} · ${room.participantCount} participant${room.participantCount !== 1 ? 's' : ''}`}
        action={
          can('room:draw') && room.status === 'pending' ? (
            <Dialog open={drawDialogOpen} onOpenChange={setDrawDialogOpen}>
              <DialogTrigger asChild>
                <Button disabled={!canDraw} title={drawDisabledReason}>
                  <Gift className="size-4" />
                  Draw names
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-sm">
                <DialogHeader>
                  <DialogTitle>Run the draw</DialogTitle>
                  <DialogDescription>
                    Pick the day everyone exchanges gifts. Names are drawn and
                    the date is shared with all participants (you can change it
                    later).
                  </DialogDescription>
                </DialogHeader>
                <div className="mt-2 space-y-3">
                  <div className="text-sm">
                    <span className="text-muted-foreground">
                      Gift-exchange date{' '}
                    </span>
                    {exchangeDate ? (
                      <span className="font-medium text-primary">
                        {format(exchangeDate, 'EEE, d MMM yyyy')}
                      </span>
                    ) : (
                      <span className="italic text-muted-foreground">
                        not chosen
                      </span>
                    )}
                  </div>
                  <div className="santa-cal flex justify-center">
                    <DayPicker
                      mode="single"
                      selected={exchangeDate}
                      onSelect={setExchangeDate}
                      weekStartsOn={1}
                      disabled={{ before: today }}
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <Button
                      variant="outline"
                      onClick={() => setDrawDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      disabled={!exchangeDate || drawMutation.isPending}
                      onClick={() => {
                        if (exchangeDate) {
                          drawMutation.mutate(
                            format(exchangeDate, 'yyyy-MM-dd'),
                          );
                        }
                      }}
                    >
                      <Gift className="size-4" />
                      {drawMutation.isPending ? 'Drawing…' : 'Draw names'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          ) : null
        }
      />

      {(room.budget !== undefined || room.currency) && (
        <div className="mb-6 flex items-center gap-2 rounded-lg border border-primary/20 bg-primary-soft px-4 py-3 text-sm font-medium text-foreground">
          <Gift className="size-4 text-primary" />
          Gift budget: {room.currency ?? ''}
          {room.budget} per person
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Participants</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <ul className="space-y-2">
              {room.participants.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2 text-sm">
                    <span>{p.displayName}</span>
                    <span className="rounded border border-border px-1.5 py-0.5 text-xs text-muted-foreground">
                      {p.role}
                    </span>
                  </div>
                  {can('room:kick') && p.id !== user?.id && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 px-2 text-xs"
                      disabled={kickMutation.isPending}
                      onClick={() => kickMutation.mutate(p.id)}
                    >
                      Kick
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Invite &amp; settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="mb-1.5 text-sm text-muted-foreground">
                Invite code
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded bg-muted px-3 py-1.5 text-sm font-mono">
                  {room.inviteCode}
                </code>
                {can('room:invite') && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="shrink-0"
                    disabled={regenerateCodeMutation.isPending}
                    onClick={() => regenerateCodeMutation.mutate()}
                  >
                    <RefreshCw className="size-3.5" />
                    New
                  </Button>
                )}
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground">
                Share this room's <strong>ID</strong> ({room.id}) and code so
                others can join.
              </p>
            </div>

            {room.exchangeDate && (
              <div>
                <p className="mb-1 text-sm text-muted-foreground">
                  Gift exchange
                </p>
                <div className="flex items-center gap-2 text-sm font-medium">
                  <CalendarDays className="size-4 text-primary" />
                  {format(new Date(room.exchangeDate), 'EEEE, d MMM yyyy')}
                </div>
              </div>
            )}

            {can('room:edit') && room.status === 'drawn' && (
              <Dialog open={changeDateOpen} onOpenChange={setChangeDateOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline">
                    <CalendarDays className="size-4" />
                    Change date
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-sm">
                  <DialogHeader>
                    <DialogTitle>Change exchange date</DialogTitle>
                    <DialogDescription>
                      Pick a new gift-exchange date.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="mt-2 space-y-3">
                    <div className="text-sm">
                      <span className="text-muted-foreground">New date </span>
                      {changeDate ? (
                        <span className="font-medium text-primary">
                          {format(changeDate, 'EEE, d MMM yyyy')}
                        </span>
                      ) : (
                        <span className="italic text-muted-foreground">
                          not chosen
                        </span>
                      )}
                    </div>
                    <div className="santa-cal flex justify-center">
                      <DayPicker
                        mode="single"
                        selected={changeDate}
                        onSelect={setChangeDate}
                        weekStartsOn={1}
                        disabled={{ before: today }}
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                      <Button
                        variant="outline"
                        onClick={() => setChangeDateOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        disabled={!changeDate || changeDateMutation.isPending}
                        onClick={() => {
                          if (changeDate) {
                            changeDateMutation.mutate(
                              format(changeDate, 'yyyy-MM-dd'),
                            );
                          }
                        }}
                      >
                        {changeDateMutation.isPending ? 'Saving…' : 'Save'}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}

            {can('room:delete') && (
              <Button
                size="sm"
                variant="outline"
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                disabled={deleteRoomMutation.isPending}
                onClick={() => {
                  if (confirm('Delete this room? This cannot be undone.')) {
                    deleteRoomMutation.mutate();
                  }
                }}
              >
                <Trash2 className="size-4" />
                Delete room
              </Button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Your wishlist</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {wishlist && wishlist.items.length > 0 && (
              <ul className="list-inside list-disc text-sm">
                {wishlist.items.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            )}
            {can('wishlist:set') && (
              <form onSubmit={handleWishlistSubmit} className="space-y-2">
                <Input
                  placeholder="One gift idea per line"
                  value={wishlistInput}
                  onChange={(e) => setWishlistInput(e.target.value)}
                />
                <Button
                  type="submit"
                  size="sm"
                  disabled={updateWishlistMutation.isPending}
                >
                  {updateWishlistMutation.isPending
                    ? 'Saving...'
                    : 'Save wishlist'}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        {room.status === 'drawn' && (
          <Card>
            <CardHeader>
              <CardTitle>
                <Gift className="mr-1 inline size-5 text-primary" />
                Your giftee
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {assignment ? (
                <>
                  <p className="text-sm">
                    You're gifting{' '}
                    <strong className="text-primary">
                      {assignment.receiver.displayName}
                    </strong>
                  </p>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Their wishlist
                  </p>
                  {assignment.receiver.wishlist.length > 0 ? (
                    <ul className="list-inside list-disc text-sm">
                      {assignment.receiver.wishlist.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No wishlist yet.
                    </p>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Loading assignment…
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
