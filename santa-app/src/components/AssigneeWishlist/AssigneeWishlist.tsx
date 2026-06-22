import { useOptimistic, useState, useTransition } from 'react';
import { useAssigneeWishlist } from '@/hooks/useAssigneeWishlist';
import { StatusMessage } from '../ui/StatusMessage/StatusMessage';

interface AssigneeWishlistProps {
  roomId: string;
  userId: string;
}

interface OptimisticState {
  bought: Set<string>;
  pendingKey: string | null;
}

function safeHttpUrl(raw?: string): string | null {
  if (!raw) return null;
  try {
    const u = new URL(raw, window.location.href);
    return u.protocol === 'http:' || u.protocol === 'https:' ? u.toString() : null;
  } catch {
    return null;
  }
}

async function fakePersistBought(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 400));
}

export function AssigneeWishlist({ roomId, userId }: AssigneeWishlistProps) {
  const { data, isLoading, isError, error } = useAssigneeWishlist(roomId, userId);

  const [bought, setBought] = useState<Set<string>>(new Set());
  const [, startTransition] = useTransition();

  const [optimistic, applyOptimistic] = useOptimistic<OptimisticState, string>(
    { bought, pendingKey: null },
    (state, key) => {
      const next = new Set(state.bought);

      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }

      return { bought: next, pendingKey: key };
    }
  );

  async function toggleBought(key: string) {
    startTransition(async () => {
      applyOptimistic(key);
      try {
        await fakePersistBought();
        setBought((prev) => {
          const next = new Set(prev);

          if (next.has(key)) {
            next.delete(key);
          } else {
            next.add(key);
          }

          return next;
        });
      } catch (err) {
        console.log(err);
      }
    });
  }

  if (isLoading) return <StatusMessage>Loading your assignee's wishlist…</StatusMessage>;
  if (isError) return <StatusMessage variant="error">{(error as Error).message}</StatusMessage>;
  if (!data || data.items.length === 0) {
    return (
      <StatusMessage>
        {data?.userName
          ? `${data.userName} has not added any wishlist items yet.`
          : 'Your assignee has not added any wishlist items yet.'}
      </StatusMessage>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <ul className="flex flex-col gap-2">
        {data.items.map((item, i) => {
          const safeUrl = safeHttpUrl(item.url);
          const key = String(i);
          const isBought = optimistic.bought.has(key);
          const isSaving = optimistic.pendingKey === key;

          return (
            <li
              key={i}
              className="rounded-base border-border flex items-center justify-between gap-3 border p-3"
            >
              <span className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => toggleBought(key)}
                  aria-label={isBought ? 'Mark as not bought' : 'Mark as bought'}
                  className="flex items-center"
                  disabled={isSaving}
                >
                  <input type="checkbox" checked={isBought} readOnly tabIndex={-1} />
                </button>

                {safeUrl ? (
                  <a
                    href={safeUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                    className={`text-brand-soft text-sm hover:underline ${isBought ? 'line-through opacity-60' : ''}`}
                  >
                    {item.name}
                  </a>
                ) : (
                  <span
                    className={`text-foreground text-sm ${isBought ? 'line-through opacity-60' : ''}`}
                  >
                    {item.name}
                  </span>
                )}

                {isSaving && <span className="text-muted-foreground text-xs">saving…</span>}
              </span>

              {item.priority != null && (
                <span className="text-muted-foreground text-xs">priority {item.priority}</span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
