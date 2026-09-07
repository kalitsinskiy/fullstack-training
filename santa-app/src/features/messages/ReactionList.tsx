import type { Reaction } from '@/types/api';

export function ReactionList({
  mine,
  theirs,
}: {
  mine: Reaction | null;
  theirs: Reaction | null;
}) {
  if (!mine && !theirs) return null;

  return (
    <div className="ml-auto flex gap-1">
      {theirs && (
        <span
          className="rounded-full bg-foreground px-1.5 py-1 text-sm leading-none"
          aria-label={`They reacted ${theirs}`}
        >
          {theirs}
        </span>
      )}
      {mine && (
        <span
          className="rounded-full bg-muted-foreground px-1.5 py-1 text-sm leading-none"
          aria-label={`You reacted ${mine}`}
        >
          {mine}
        </span>
      )}
    </div>
  );
}
