import { Link } from 'react-router-dom';
import { MessageCircle, Users } from 'lucide-react';
import { useRooms } from '@/features/rooms/api';
import { getApiErrorMessage } from '@/lib/api';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/EmptyState';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function MessagesPage() {
  const roomsQuery = useRooms(1);
  const drawnRooms = (roomsQuery.data?.data ?? []).filter(
    (room) => room.status === 'drawn',
  );

  return (
    <>
      <PageHeader
        title="Messages"
        description="Pick a room to chat with your giftee and your Secret Santa."
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

      {roomsQuery.isSuccess && drawnRooms.length === 0 && (
        <EmptyState
          icon={MessageCircle}
          title="No chats yet"
          description="Once a room has run its draw, you can send anonymous wishes to your giftee — and reply to your own Secret Santa."
          action={
            <Button asChild variant="outline">
              <Link to="/rooms">Go to your rooms</Link>
            </Button>
          }
        />
      )}

      {roomsQuery.isSuccess && drawnRooms.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {drawnRooms.map((room) => (
            <Card key={room.id} className="flex flex-col transition-shadow hover:shadow-md">
              <CardHeader>
                <CardTitle className="text-lg">{room.name}</CardTitle>
              </CardHeader>
              <CardContent className="mt-auto flex items-center justify-between gap-3">
                <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Users className="size-4" />
                  {room.participantCount}{' '}
                  {room.participantCount === 1 ? 'participant' : 'participants'}
                </span>
                <Button asChild size="sm">
                  <Link to={`/rooms/${room.id}/messages`}>
                    <MessageCircle /> Open chats
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
