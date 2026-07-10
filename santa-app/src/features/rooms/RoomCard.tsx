import { Link } from 'react-router-dom';
import { Users } from 'lucide-react';
import type { RoomSummary } from '@/types/api';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function RoomCard({ room }: { room: RoomSummary }) {
  const count = room.participantCount;

  return (
    <Link to={`/rooms/${room.id}`} className="block focus-visible:outline-none">
      <Card className="p-5 transition-colors hover:border-primary/40">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display text-lg font-semibold">{room.name}</h3>
          <Badge variant={room.status === 'drawn' ? 'drawn' : 'pending'}>
            {room.status === 'drawn' ? 'Drawn' : 'Pending'}
          </Badge>
        </div>
        <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
          <Users className="size-4" /> {count} participant
          {count === 1 ? '' : 's'}
        </p>
      </Card>
    </Link>
  );
}
