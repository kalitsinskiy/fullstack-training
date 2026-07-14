import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import {
  CalendarDays,
  Gift,
  RefreshCw,
  Sparkles,
  Trash2,
  UserMinus,
  Wallet,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/features/auth/useAuth';
import {
  useAssignment,
  useChangeExchangeDate,
  useDeleteRoom,
  useDrawRoom,
  useKickMember,
  useMyWishlist,
  useRegenerateInvite,
  useRoom,
  useSaveWishlist,
} from '@/features/rooms/api';
import { usePermissions } from '@/features/rooms/usePermissions';
import { getApiErrorMessage } from '@/lib/api';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { Permission, RoomDetail } from '@/types/api';

const MIN_PARTICIPANTS = 3;

type Can = (permission: Permission) => boolean;

export function RoomDetailPage() {
  const { id = '' } = useParams<{ id: string }>();
  const { user } = useAuth();
  const roomQuery = useRoom(id);
  const room = roomQuery.data;

  const { can } = usePermissions(room);
  const isDrawn = room?.status === 'drawn';

  if (roomQuery.isLoading) {
    return <PageHeader title="Room" description="Loading…" />;
  }
  if (roomQuery.isError || !room) {
    return (
      <PageHeader
        title="Room not found"
        description="This room doesn't exist or you're not a participant."
      />
    );
  }

  return (
    <>
      <PageHeader
        title={room.name}
        description={`Status: ${room.status} · ${room.participantCount} participant${room.participantCount === 1 ? '' : 's'}`}
        action={
          can('room:draw') && !isDrawn ? (
            <DrawDialog
              roomId={id}
              disabled={room.participantCount < MIN_PARTICIPANTS}
            />
          ) : undefined
        }
      />

      {typeof room.budget === 'number' && (
        <div className="mb-6 flex items-center gap-2 rounded-lg bg-primary-soft px-4 py-3 text-primary">
          <Wallet className="size-5" />
          <span className="font-medium">
            Gift budget: {room.currency ?? '$'}
            {room.budget} per person
          </span>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <ParticipantsCard room={room} can={can} />
        <InviteSettingsCard room={room} can={can} />
        <WishlistCard roomId={id} userId={user?.id} />
        <GifteeCard roomId={id} enabled={isDrawn} />
      </div>
    </>
  );
}

function ParticipantsCard({ room, can }: { room: RoomDetail; can: Can }) {
  const kickMember = useKickMember(room.id);
  const canKick = can('room:kick');

  function handleKick(memberId: string) {
    if (!canKick) return;
    kickMember.mutate(memberId, {
      onSuccess: () => toast.success('Member removed'),
      onError: (error) =>
        toast.error(getApiErrorMessage(error, 'Could not remove the member')),
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Participants</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {room.participants.map((p) => (
          <div
            key={p.id}
            className="flex items-center gap-2 rounded-md border border-border px-3 py-2"
          >
            <span className="font-medium text-foreground">{p.displayName}</span>
            <span className="rounded-full bg-primary-soft px-2.5 py-0.5 text-xs font-medium text-primary">
              {p.role}
            </span>
            {/* Kick: owner-only, and never the owner themselves. */}
            {canKick && p.role !== 'owner' && (
              <Button
                variant="outline"
                size="sm"
                className="ml-auto"
                disabled={kickMember.isPending}
                onClick={() => handleKick(p.id)}
              >
                <UserMinus /> Kick
              </Button>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function InviteSettingsCard({ room, can }: { room: RoomDetail; can: Can }) {
  const navigate = useNavigate();
  const regenerate = useRegenerateInvite(room.id);
  const deleteRoom = useDeleteRoom(room.id);

  const canInvite = can('room:invite');
  const canDelete = can('room:delete');

  function handleRegenerate() {
    if (!canInvite) return;
    regenerate.mutate(undefined, {
      onSuccess: () => toast.success('New invite code generated'),
      onError: (error) =>
        toast.error(getApiErrorMessage(error, 'Could not regenerate the code')),
    });
  }

  function handleDelete() {
    if (!canDelete) return;
    if (!window.confirm('Delete this room? This cannot be undone.')) return;
    deleteRoom.mutate(undefined, {
      onSuccess: () => {
        toast.success('Room deleted');
        navigate('/rooms');
      },
      onError: (error) =>
        toast.error(getApiErrorMessage(error, 'Could not delete the room')),
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Invite &amp; settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">Invite code</p>
          <div className="flex items-center gap-2">
            <code className="inline-block rounded-md bg-muted px-3 py-1.5 font-mono text-foreground">
              {room.inviteCode}
            </code>
            {canInvite && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRegenerate}
                disabled={regenerate.isPending}
              >
                <RefreshCw /> New
              </Button>
            )}
          </div>
        </div>

        {room.exchangeDate && (
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">Gift exchange</p>
            <p className="flex items-center gap-2 text-primary">
              <CalendarDays className="size-4" />
              {format(new Date(room.exchangeDate), 'EEEE, d MMM yyyy')}
            </p>
          </div>
        )}

        {can('room:edit') && room.status === 'drawn' && (
          <ChangeDateDialog roomId={room.id} current={room.exchangeDate} />
        )}

        {canDelete && (
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={deleteRoom.isPending}
          >
            <Trash2 /> Delete room
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function WishlistCard({
  roomId,
  userId,
}: {
  roomId: string;
  userId: string | undefined;
}) {
  const wishlistQuery = useMyWishlist(roomId, userId);
  const saveWishlist = useSaveWishlist(roomId, userId);
  const [text, setText] = useState('');

  // Seed the textarea once the saved wishlist loads.
  useEffect(() => {
    if (wishlistQuery.data) {
      setText(wishlistQuery.data.items.join('\n'));
    }
  }, [wishlistQuery.data]);

  function handleSave() {
    const items = text
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
    saveWishlist.mutate(items, {
      onSuccess: () => toast.success('Wishlist saved'),
      onError: (error) =>
        toast.error(getApiErrorMessage(error, 'Could not save your wishlist')),
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your wishlist</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="One gift idea per line"
          rows={5}
          className="w-full resize-y rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <Button onClick={handleSave} disabled={saveWishlist.isPending}>
          {saveWishlist.isPending ? 'Saving…' : 'Save wishlist'}
        </Button>
      </CardContent>
    </Card>
  );
}

function GifteeCard({ roomId, enabled }: { roomId: string; enabled: boolean }) {
  const assignmentQuery = useAssignment(roomId, enabled);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gift className="size-5 text-primary" /> Your giftee
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {!enabled && (
          <p className="text-sm text-muted-foreground">
            Revealed after the draw.
          </p>
        )}
        {enabled && assignmentQuery.isLoading && (
          <p className="text-sm text-muted-foreground">Loading…</p>
        )}
        {enabled && assignmentQuery.data && (
          <>
            <p className="text-foreground">
              You&apos;re gifting{' '}
              <span className="font-semibold text-primary">
                {assignmentQuery.data.receiver.displayName}
              </span>
            </p>
            <div>
              <p className="text-sm font-medium text-foreground">
                Their wishlist
              </p>
              {assignmentQuery.data.receiver.wishlist.length > 0 ? (
                <ul className="mt-1 list-inside list-disc text-sm text-muted-foreground">
                  {assignmentQuery.data.receiver.wishlist.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No wishlist yet.
                </p>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function DrawDialog({
  roomId,
  disabled,
}: {
  roomId: string;
  disabled: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Date | undefined>();
  const drawRoom = useDrawRoom(roomId);

  function handleDraw() {
    if (!selected) return;
    drawRoom.mutate(format(selected, 'yyyy-MM-dd'), {
      onSuccess: () => {
        toast.success('Names drawn!');
        setOpen(false);
      },
      onError: (error) =>
        toast.error(getApiErrorMessage(error, 'Could not run the draw')),
    });
  }

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        disabled={disabled}
        title={
          disabled
            ? `Need at least ${MIN_PARTICIPANTS} participants`
            : undefined
        }
      >
        <Sparkles /> Draw names
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Run the draw</DialogTitle>
            <DialogDescription>
              Pick the day everyone exchanges gifts. Names are drawn and the
              date is shared with all participants (you can change it later).
            </DialogDescription>
          </DialogHeader>
          <ExchangeCalendar selected={selected} onSelect={setSelected} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleDraw}
              disabled={!selected || drawRoom.isPending}
            >
              <Sparkles /> {drawRoom.isPending ? 'Drawing…' : 'Draw names'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function ChangeDateDialog({
  roomId,
  current,
}: {
  roomId: string;
  current: string | undefined;
}) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Date | undefined>(
    current ? new Date(current) : undefined,
  );
  const changeDate = useChangeExchangeDate(roomId);

  function handleSave() {
    if (!selected) return;
    changeDate.mutate(format(selected, 'yyyy-MM-dd'), {
      onSuccess: () => {
        toast.success('Exchange date updated');
        setOpen(false);
      },
      onError: (error) =>
        toast.error(getApiErrorMessage(error, 'Could not update the date')),
    });
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <CalendarDays /> Change date
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change the gift-exchange date</DialogTitle>
            <DialogDescription>
              The new date is shared with every participant.
            </DialogDescription>
          </DialogHeader>
          <ExchangeCalendar selected={selected} onSelect={setSelected} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!selected || changeDate.isPending}
            >
              {changeDate.isPending ? 'Saving…' : 'Save date'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function ExchangeCalendar({
  selected,
  onSelect,
}: {
  selected: Date | undefined;
  onSelect: (date: Date | undefined) => void;
}) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-primary">
        Gift-exchange date{' '}
        <span className="text-foreground">
          {selected ? format(selected, 'EEE, d MMM yyyy') : '—'}
        </span>
      </p>
      <div className="flex justify-center">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={onSelect}
          disabled={{ before: new Date() }}
        />
      </div>
    </div>
  );
}
