import { cn } from '@/lib/utils';
import type { ChatMessage } from '@/types/api';

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function Bubble({ msg }: { msg: ChatMessage }) {
  const out = msg.direction === 'out';
  return (
    <div className={cn('flex', out ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[70%] rounded-2xl px-4 py-2 text-sm',
          out
            ? 'rounded-br-sm bg-primary text-primary-foreground'
            : 'rounded-bl-sm bg-muted text-foreground',
        )}
      >
        <p className="break-words">{msg.text}</p>
        <p
          className={cn(
            'mt-1 text-right text-[10px]',
            out ? 'text-primary-foreground/70' : 'text-muted-foreground',
          )}
        >
          {formatTime(msg.createdAt)}
        </p>
      </div>
    </div>
  );
}
