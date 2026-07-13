import { useState, useEffect, type FormEvent } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RefreshCw, UserMinus, Wallet, CalendarDays, Trash2, Gift, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import { api, getApiErrorMessage } from '@/lib/api';
import { useAuth } from '@/features/auth/useAuth';
import { usePermissions } from '@/features/rooms/usePermissions';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DrawDialog } from '@/components/DrawDialog';
import type { RoomDetail, Assignment, Wishlist } from '@/types/api';

export function RoomDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: room, isLoading } = useQuery<RoomDetail>({
    queryKey: ['rooms', id],
    queryFn: () => api.get<RoomDetail>(`/api/rooms/${id}`).then((r) => r.data),
  });

  const { data: assignment } = useQuery<Assignment>({
    queryKey: ['rooms', id, 'assignment'],
    queryFn: () => api.get<Assignment>(`/api/rooms/${id}/assignment`).then((r) => r.data),
    enabled: room?.status === 'drawn',
    retry: false,
  });

  const { data: myWishlist } = useQuery<Wishlist>({
    queryKey: ['rooms', id, 'wishlist', user?.id],
    queryFn: () =>
      api.get<Wishlist>(`/api/rooms/${id}/wishlist/${user!.id}`).then((r) => r.data),
    enabled: !!user,
  });

  const [wishlistText, setWishlistText] = useState('');
  const [drawDialogOpen, setDrawDialogOpen] = useState(false);
  useEffect(() => {
    if (myWishlist) setWishlistText(myWishlist.items.join('\n'));
  }, [myWishlist]);

  const saveWishlist = useMutation({
    mutationFn: (items: string[]) =>
      api.put(`/api/rooms/${id}/wishlist`, { items }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rooms', id, 'wishlist', user?.id] });
      toast.success('Wishlist saved');
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Failed to save wishlist')),
  });

  const regenCode = useMutation({
    mutationFn: () =>
      api.post<RoomDetail>(`/api/rooms/${id}/invite-code/regenerate`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rooms', id] });
      toast.success('Invite code regenerated');
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Failed to regenerate code')),
  });

  const kickMember = useMutation({
    mutationFn: (userId: string) =>
      api.delete(`/api/rooms/${id}/members/${userId}`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rooms', id] });
      toast.success('Member removed');
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Failed to remove member')),
  });

  const deleteRoom = useMutation({
    mutationFn: () => api.delete(`/api/rooms/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rooms'] });
      toast.success('Room deleted');
      window.location.assign('/rooms');
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Failed to delete room')),
  });

  const draw = useMutation({
    mutationFn: (exchangeDate: string) =>
      api.post<RoomDetail>(`/api/rooms/${id}/draw`, { exchangeDate }).then((r) => r.data),
    onSuccess: () => {
      setDrawDialogOpen(false);
      qc.invalidateQueries({ queryKey: ['rooms', id] });
      qc.invalidateQueries({ queryKey: ['rooms', id, 'assignment'] });
      toast.success('Draw completed!');
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Failed to run draw')),
  });

  function handleSaveWishlist(e: FormEvent) {
    e.preventDefault();
    const items = wishlistText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
    saveWishlist.mutate(items);
  }

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (!room) return <p className="text-sm text-muted-foreground">Room not found.</p>;

  const { can } = usePermissions(room);
  const canDraw = can('room:draw');
  const canKick = can('room:kick');
  const canInvite = can('room:invite');
  const canDelete = can('room:delete');

  return (
    <>
      <PageHeader
        title={room.name}
        description={`Status: ${room.status} · ${room.participantCount} participants`}
      />

      {/* Budget banner */}
      {room.budget && (
        <div className="mb-6 flex items-center gap-2 rounded-xl bg-primary/10 px-4 py-3 text-sm font-medium text-primary">
          <Wallet className="size-4 shrink-0" />
          Gift budget: {room.currency}{room.budget} per person
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Participants */}
        <Card>
          <CardHeader>
            <CardTitle>Participants</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {room.participants.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between rounded-lg border border-border px-4 py-2.5"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{p.displayName}</span>
                  <span className="rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground">
                    {p.role}
                  </span>
                </div>
                {canKick && p.role !== 'owner' && (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-7 gap-1 text-xs"
                    onClick={() => kickMember.mutate(p.id)}
                    disabled={kickMember.isPending}
                  >
                    <UserMinus className="size-3.5" /> Kick
                  </Button>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Invite & settings */}
        <Card>
          <CardHeader>
            <CardTitle>Invite &amp; settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <p className="mb-1.5 text-sm font-medium">Invite code</p>
              <div className="flex gap-2">
                <Input readOnly value={room.inviteCode} className="font-mono" />
                {canInvite && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => regenCode.mutate()}
                    disabled={regenCode.isPending}
                    title="Regenerate"
                  >
                    <RefreshCw className="size-4" />
                  </Button>
                )}
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground">
                Share this room's <strong>ID</strong> ({room.id}) and code so others can join.
              </p>
            </div>

            {canDraw && room.status === 'pending' && (
              <DrawDialog
                open={drawDialogOpen}
                onOpenChange={setDrawDialogOpen}
                onDraw={draw.mutate}
                isLoading={draw.isPending}
                participantCount={room.participantCount}
              />
            )}

            {room.exchangeDate && (
              <div>
                <p className="mb-1 text-sm font-medium">Gift exchange</p>
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CalendarDays className="size-4" />
                  {new Date(room.exchangeDate).toLocaleDateString('en-GB', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </p>
              </div>
            )}

            {canDelete && (
              <Button
                type="button"
                variant="outline"
                className="gap-2 text-destructive hover:bg-destructive/10"
                onClick={() => {
                  if (confirm('Delete this room? This cannot be undone.')) deleteRoom.mutate();
                }}
                disabled={deleteRoom.isPending}
              >
                <Trash2 className="size-4" /> Delete room
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Wishlist */}
        <Card>
          <CardHeader>
            <CardTitle>Your wishlist</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveWishlist} className="space-y-4">
              <textarea
                className="h-36 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-y"
                placeholder="One gift idea per line"
                value={wishlistText}
                onChange={(e) => setWishlistText(e.target.value)}
              />
              <Button type="submit" disabled={saveWishlist.isPending}>
                {saveWishlist.isPending ? 'Saving…' : 'Save wishlist'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Giftee */}
        {room.status === 'drawn' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="size-4 text-primary" /> Your giftee
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {assignment ? (
                <>
                  <p className="text-sm">
                    You're gifting{' '}
                    <strong className="text-primary">{assignment.receiver.displayName}</strong>
                  </p>
                  <div>
                    <p className="mb-1 text-sm font-medium">Their wishlist</p>
                    {assignment.receiver.wishlist.length > 0 ? (
                      <ul className="space-y-1">
                        {assignment.receiver.wishlist.map((item, i) => (
                          <li key={i} className="text-sm text-muted-foreground">
                            • {item}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground">No wishlist yet.</p>
                    )}
                  </div>
                  <Button variant="outline" size="sm" className="gap-2">
                    <MessageCircle className="size-4" /> Send an anonymous message
                  </Button>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Loading assignment…</p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
