import { clsx } from 'clsx';
import { Button } from '@/components/ui/button';

type RoomCardCommonProps = { name: string; code: string; participantCount: number };

type RoomCardProps =
  | (RoomCardCommonProps & { status: 'open'; onJoin: () => void })
  | (RoomCardCommonProps & { status: 'drawn'; onView: () => void })
  | (RoomCardCommonProps & { status: 'closed' });

const badgeClasses = {
  open: 'bg-pending-bg text-pending-text',
  drawn: 'bg-drawn-bg text-drawn-text',
  closed: 'bg-closed-bg text-closed-text',
};

const badgeLabels = { open: 'Pending', drawn: 'Drawn', closed: 'Closed' };

export function RoomCard(props: RoomCardProps) {
  const { name, code, participantCount, status } = props;

  let action: React.ReactNode = null;

  if (props.status === 'open') {
    action = (
      <Button variant="outline" size="sm" onClick={props.onJoin}>
        Join
      </Button>
    );
  } else if (props.status === 'drawn') {
    action = (
      <Button variant="outline" size="sm" onClick={props.onView}>
        View
      </Button>
    );
  }

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

      <p className="text-muted-foreground text-[0.85rem]">{participantCount} participants</p>

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

        {action}
      </div>
    </article>
  );
}
