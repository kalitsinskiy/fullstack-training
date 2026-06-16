import { clsx } from 'clsx';
import { Button } from '@/components/ui/button';
import type { Room } from '@/types/api';

interface RoomCardProps {
  room: Room;
  onJoin?: () => void;
  onOpen?: () => void;
}

const badgeClasses = {
  pending: 'bg-pending-bg text-pending-text',
  drawn: 'bg-drawn-bg text-drawn-text',
  closed: 'bg-closed-bg text-closed-text',
};

const badgeLabels = { pending: 'Pending', drawn: 'Drawn', closed: 'Closed' };

export function RoomCard({ room, onJoin, onOpen }: RoomCardProps) {
  const { name, code, members, status } = room;

  return (
    <article
      className={clsx(
        '@container',
        'flex flex-col gap-4',
        'rounded-card bg-card border-border border',
        'p-6',
        'transition-[transform,box-shadow] duration-150',
        'hover:-translate-y-0.5 hover:shadow-lg'
      )}
    >
      <div className="flex flex-col gap-1 @sm:flex-row @sm:items-baseline @sm:gap-3">
        <span className="text-foreground text-base font-bold">{name}</span>
        <span className="text-muted-foreground font-mono text-[0.78rem] tracking-[0.08em]">
          {code}
        </span>
      </div>

      <p className="text-muted-foreground text-[0.85rem]">{members.length} participants</p>

      <div className="mt-auto flex items-center justify-between pt-2">
        <span
          className={clsx(
            'rounded-full px-[0.7rem] py-1',
            'text-[0.68rem] font-bold tracking-widest uppercase',
            badgeClasses[status]
          )}
        >
          {badgeLabels[status]}
        </span>

        <span className="flex gap-2">
          {status === 'pending' && onJoin && (
            <Button variant="outline" size="sm" onClick={onJoin}>
              Join
            </Button>
          )}
          {onOpen && (
            <Button variant="outline" size="sm" onClick={onOpen}>
              View
            </Button>
          )}
        </span>
      </div>
    </article>
  );
}
