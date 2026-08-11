import { cn } from '@/lib/utils';
import { type Reaction, REACTIONS } from '@/types/api';

export function ReactionPicker({
  current,
  outgoing,
  onPick,
}: {
  current: Reaction | null;
  outgoing: boolean;
  onPick: (emoji: Reaction | null) => void;
}) {
  return (
    <span
      className={cn(
        'absolute bottom-1 z-10 hidden gap-0.5 rounded-full border border-border',
        'bg-popover p-1 shadow-md',
        'group-hover:flex group-focus-within:flex',
        outgoing ? 'right-0' : 'left-0',
      )}
    >
      {REACTIONS.map((emoji) => (
        <button
          key={emoji}
          type="button"
          onClick={() => onPick(current === emoji ? null : emoji)}
          aria-label={emoji}
          aria-pressed={current === emoji}
          className={cn(
            'rounded-full px-1 text-base leading-none transition-transform',
            'hover:scale-125',
            current === emoji && 'bg-accent',
          )}
        >
          {emoji}
        </button>
      ))}
    </span>
  );
}
