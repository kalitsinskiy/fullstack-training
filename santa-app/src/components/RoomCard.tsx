import { Link } from 'react-router-dom';
import { Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { RoomStatus, RoomSummary } from '@/types/api';

const STATUS_STYLES: Record<RoomStatus, string> = {
  pending: 'bg-amber-100 text-amber-800',
  drawn: 'bg-emerald-100 text-emerald-800',
};

const STATUS_LABELS: Record<RoomStatus, string> = {
  pending: 'Pending',
  drawn: 'Drawn',
};

export function RoomCard({ room }: { room: RoomSummary }) {
  return (
    <Card className="flex flex-col transition-shadow hover:shadow-md">
      <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
        <CardTitle className="text-lg">{room.name}</CardTitle>
        <span
          className={cn(
            'shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium',
            STATUS_STYLES[room.status],
          )}
        >
          {STATUS_LABELS[room.status]}
        </span>
      </CardHeader>
      <CardContent className="mt-auto flex items-center justify-between gap-3">
        <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Users className="size-4" />
          {room.participantCount}{' '}
          {room.participantCount === 1 ? 'participant' : 'participants'}
        </span>
        <Button asChild variant="outline" size="sm">
          <Link to={`/rooms/${room.id}`}>Open</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
