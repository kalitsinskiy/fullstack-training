import { Link } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { RoomDetail } from '@/types/api';

interface RoomChatRowProps {
  room: RoomDetail;
  unread: number;
}

export function RoomChatRow({ room, unread }: RoomChatRowProps) {
  return (
    <Link
      to={`/rooms/${room.id}/messages`}
      className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3 transition-colors hover:bg-muted"
    >
      <div className="flex items-center gap-3">
        <MessageCircle
          className={cn(
            'size-5 shrink-0',
            unread > 0 ? 'text-primary' : 'text-muted-foreground',
          )}
        />
        <div>
          <p
            className={cn(
              'text-sm',
              unread > 0 ? 'font-semibold text-foreground' : 'text-foreground',
            )}
          >
            {room.name}
          </p>
          <p className="text-xs text-muted-foreground">
            {room.participantCount} participant
            {room.participantCount !== 1 ? 's' : ''}
          </p>
        </div>
      </div>
      {unread > 0 && (
        <span className="flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
          {unread > 9 ? '9+' : unread}
        </span>
      )}
    </Link>
  );
}
