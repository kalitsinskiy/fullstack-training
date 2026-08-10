import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSocket } from '@/features/socket/SocketContext';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Users,
  CalendarDays,
  Gift,
  Pencil,
  Trash2,
  RefreshCw,
  X,
  MessageCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/features/auth/useAuth';
import {
  useRoom,
  useAssignment,
  useDeleteRoom,
  useKickMember,
  useRegenerateInvite,
} from '@/features/rooms/hooks';
import { roomKeys } from '@/features/rooms/keys';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/EmptyState';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { WishlistEditor } from '@/features/rooms/WishlistEditor';
import { DrawDialog } from '@/features/rooms/DrawDialog';
import { usePermissions } from '@/features/rooms/usePermissions';
import { toast } from 'sonner';
import { EditRoomDialog } from '@/features/rooms/EditRoomDialog';
import { isExchangePassed } from '@/features/rooms/helpers';

function initials(name: string) {
  return name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function RoomDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { data: room, isLoading, isError } = useRoom(id);
  const [drawOpen, setDrawOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const navigate = useNavigate();
  const { can } = usePermissions(room);
  const del = useDeleteRoom(id ?? '');
  const kick = useKickMember(id ?? '');
  const regen = useRegenerateInvite(id ?? '');
  const isDraw = room?.status === 'drawn';
  const assignment = useAssignment(id ?? '', !!id && isDraw);
  const queryClient = useQueryClient();
  const { socket, joinRoom, leaveRoom } = useSocket();

  useEffect(() => {
    if (!socket || !id) return;

    joinRoom(id);

    const onMemberJoined = () =>
      void queryClient.invalidateQueries({ queryKey: roomKeys.detail(id) });

    const onDrawCompleted = () => {
      void queryClient.invalidateQueries({ queryKey: roomKeys.detail(id) });
      void queryClient.invalidateQueries({
        queryKey: roomKeys.assignment(id),
      });
    };

    const onDateChanged = () =>
      void queryClient.invalidateQueries({ queryKey: roomKeys.detail(id) });

    socket.on('room:member-joined', onMemberJoined);
    socket.on('room:draw-completed', onDrawCompleted);
    socket.on('room:date-changed', onDateChanged);

    return () => {
      leaveRoom(id);
      socket.off('room:member-joined', onMemberJoined);
      socket.off('room:draw-completed', onDrawCompleted);
      socket.off('room:date-changed', onDateChanged);
    };
  }, [socket, id, joinRoom, leaveRoom, queryClient]);

  if (isLoading)
    return <p className="text-sm text-muted-foreground">Loading room…</p>;

  if (isError || !room) {
    return (
      <EmptyState
        icon={Users}
        title="Room not found"
        description="This room does not exist or you are not a participant."
      />
    );
  }

  const canDraw = can('room:draw') && room.status === 'pending';
  const notEnough = room.participantCount < 3;
  const wishlishLocked = isExchangePassed(room.exchangeDate);

  // Failures are toasted centrally by the MutationCache (lib/queryClient.ts);
  // each handler only describes what success means. Navigation lives in
  // onSuccess so it can never run after a failed delete.
  function handleDelete() {
    if (!can('room:delete')) return;
    if (!window.confirm('Delete this room? This cannot be undone.')) return;

    del.mutate(undefined, {
      onSuccess: () => {
        toast.success('Room deleted');
        navigate('/rooms');
      },
    });
  }

  function handleKick(userId: string) {
    if (!can('room:kick')) return;

    kick.mutate(userId, {
      onSuccess: () => toast.success('Member removed'),
    });
  }

  function handleRegenerate() {
    if (!can('room:invite')) return;

    regen.mutate(undefined, {
      onSuccess: () => toast.success('New invite code generated'),
    });
  }

  return (
    <>
      <PageHeader
        title={room.name}
        description={
          room.budget
            ? `Suggested budget: ${room.currency ?? '$'}${room.budget}`
            : undefined
        }
        action={
          <div className="flex items-center gap-2">
            <Badge variant={room.status === 'drawn' ? 'drawn' : 'pending'}>
              {room.status === 'drawn' ? 'Drawn' : 'Pending'}
            </Badge>
            {canDraw && (
              <Button
                onClick={() => setDrawOpen(true)}
                disabled={notEnough}
                title={notEnough ? 'Need at least 3 participants' : undefined}
              >
                Draw names
              </Button>
            )}
            {can('room:edit') && (
              <Button variant="outline" onClick={() => setEditOpen(true)}>
                <Pencil className="size-4" /> Edit
              </Button>
            )}
            {can('room:delete') && (
              <Button
                variant="outline"
                onClick={handleDelete}
                disabled={del.isPending}
              >
                <Trash2 className="size-4" /> Delete
              </Button>
            )}
          </div>
        }
      />
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Participants
              <span className="text-sm font-normal text-muted-foreground">
                {room.participantCount}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Invite code
              </p>
              <div className="flex items-center gap-2">
                <p
                  data-testid="invite-code"
                  className="font-mono text-lg tracking-widest"
                >
                  {room.inviteCode}
                </p>
                {can('room:invite') && (
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label="Regenerate invite code"
                    onClick={handleRegenerate}
                    disabled={regen.isPending}
                  >
                    <RefreshCw className="size-4" />
                  </Button>
                )}
              </div>
            </div>
            <ul className="space-y-2">
              {room.participants.map((p) => (
                <li key={p.id} className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>{initials(p.displayName)}</AvatarFallback>
                  </Avatar>
                  <span className="flex-1 text-sm font-medium">
                    {p.displayName}
                  </span>
                  <Badge variant={p.role === 'owner' ? 'owner' : 'member'}>
                    {p.role}
                  </Badge>
                  {can('room:kick') && p.role !== 'owner' && (
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label={`Remove ${p.displayName}`}
                      onClick={() => handleKick(p.id)}
                    >
                      <X className="size-4" />
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {isDraw && (
          <Card>
            <CardHeader className="flex flex-row items-center gap-2">
              The Draw is Done <Gift className="size-4" />
            </CardHeader>
            <CardContent className="px-6">
              {room.exchangeDate && (
                <p className="flex items-center gap-2 text-sm">
                  <CalendarDays className="size-4 text-primary" />
                  Gift exchange on{' '}
                  {format(new Date(room.exchangeDate), 'EEE, d MMM yyyy')}
                </p>
              )}
              {assignment.data && (
                <div className="my-3">
                  <p className="text-sm">
                    You're gifting:{' '}
                    <span
                      data-testid="assignment-receiver"
                      className="font-semibold"
                    >
                      {assignment.data.receiver.displayName}
                    </span>
                  </p>
                  {assignment.data.receiver.wishlist.length > 0 ? (
                    <ul className="mt-2 list-inside list-disc text-sm text-muted-foreground">
                      {assignment.data.receiver.wishlist.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-1 text-sm text-muted-foreground">
                      Your giftee has't added a wishlist yet.
                    </p>
                  )}
                </div>
              )}

              <Button
                variant="outline"
                className="mt-2"
                onClick={() => navigate(`/rooms/${room.id}/messages`)}
              >
                <MessageCircle className="size-4" /> Send an anonymous message
              </Button>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Your wishlist</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {id && user && (
              <WishlistEditor
                roomId={id}
                userId={user.id}
                locked={wishlishLocked}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {canDraw && (
        <DrawDialog
          roomId={room.id}
          open={drawOpen}
          onOpenChange={setDrawOpen}
        />
      )}

      {can('room:edit') && (
        <EditRoomDialog
          room={room}
          open={editOpen}
          onOpenChange={setEditOpen}
        />
      )}
    </>
  );
}
