import { useParams } from 'react-router-dom';
import { Users } from 'lucide-react';
import { useAuth } from '@/features/auth/useAuth';
import { useRoom } from '@/features/rooms/hooks';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/EmptyState';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { WishlistEditor } from '@/features/rooms/WishlistEditor';

/**
 * Room detail — participants, your wishlist, the draw, and your assignment.
 * TODO(lesson 03): fetch GET /api/rooms/:id; render participant list + invite code.
 * TODO(lesson 03): wishlist editor → PUT /api/rooms/:id/wishlist.
 * TODO(lesson 03): "Draw names" (creator only) → POST /api/rooms/:id/draw, then reveal
 *                  GET /api/rooms/:id/assignment.
 */

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
          <Badge variant={room.status === 'drawn' ? 'drawn' : 'pending'}>
            {room.status === 'drawn' ? 'Drawn' : 'Pending'}
          </Badge>
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
              <p className="font-mono text-lg tracking-widest">
                {room.inviteCode}
              </p>
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
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Your wishlist</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {id && user && <WishlistEditor roomId={id} userId={user.id} />}
          </CardContent>
        </Card>
      </div>
      {/* Draw section (button + calendar dialog + assignment) is added in Lesson 03. */}
    </>
  );
}
