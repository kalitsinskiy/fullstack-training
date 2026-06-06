import { clsx } from 'clsx';
import { Button } from '../UI/Button';

interface RoomCardProps {
  name: string;
  code: string;
  memberCount: number;
  status: 'pending' | 'drawn' | 'closed';
  onOpen: () => void;
}

const badgeClasses = {
  pending: 'bg-pending-bg text-pending-text',
  drawn: 'bg-drawn-bg text-drawn-text',
  closed: 'bg-closed-bg text-closed-text',
};

const badgeLabels = { pending: 'Pending', drawn: 'Drawn', closed: 'Closed' };

export function RoomCard({ name, code, memberCount, status, onOpen }: RoomCardProps) {
  return (
    <article
      className={clsx(
        '@container',
        'flex flex-col gap-4',
        'rounded-card bg-surface border border-edge',
        'p-6',
        'transition-[transform,box-shadow] duration-150',
        'hover:-translate-y-0.5 hover:shadow-lg'
      )}
    >
      <div className="flex flex-col gap-1 @sm:flex-row @sm:items-baseline @sm:gap-3">
        <span className="text-base font-bold text-fg">{name}</span>
        <span className="text-muted font-mono text-[0.78rem] tracking-[0.08em]">{code}</span>
      </div>

      <p className="text-muted text-[0.85rem]">{memberCount} participants</p>

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

        <Button variant="outline" size="sm" onClick={onOpen}>
          Open
        </Button>
      </div>
    </article>
  );
}
