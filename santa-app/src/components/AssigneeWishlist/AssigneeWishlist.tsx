import { useAssigneeWishlist } from '@/hooks/useAssigneeWishlist';

interface AssigneeWishlistProps {
  roomId: string;
  userId: string;
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

export function AssigneeWishlist({ roomId, userId }: AssigneeWishlistProps) {
  const { data, isLoading, isError, error } = useAssigneeWishlist(roomId, userId);

  if (isLoading)
    return <p className="text-muted-foreground text-sm">Loading your assignee's wishlist…</p>;

  if (isError)
    return (
      <p role="alert" className="text-sm text-red-500">
        {(error as Error).message}
      </p>
    );

  if (!data || data.items.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        {data?.userName
          ? `${data.userName} has not added any wishlist items yet.`
          : 'Your assignee has not added any wishlist items yet.'}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <ul className="flex flex-col gap-2">
        {data.items.map((item, i) => {
          const safeUrl = safeHttpUrl(item.url);
          return (
            <li
              key={i}
              className="rounded-base border-border flex items-center justify-between border p-3"
            >
              {safeUrl ? (
                <a
                  href={safeUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="text-brand-soft text-sm hover:underline"
                >
                  {item.name}
                </a>
              ) : (
                <span className="text-foreground text-sm">{item.name}</span>
              )}
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
