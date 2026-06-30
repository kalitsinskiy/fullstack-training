import { useQuery } from '@tanstack/react-query';
import { api, ApiError } from '@/services/api';

interface WishlistItem {
  name: string;
  url?: string;
  priority?: number;
}

interface AssigneeWishlistData {
  items: WishlistItem[];
  assigneeName: string;
}

export function AssigneeWishlist({ roomId }: { roomId: string }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['rooms', roomId, 'assignment', 'wishlist'],
    queryFn: () => api.get<AssigneeWishlistData>(`/api/rooms/${roomId}/assignment/wishlist`),
    retry: (failureCount, err) => {
      if (err instanceof ApiError && (err.status === 404 || err.status === 409)) return false;
      return failureCount < 3;
    },
  });

  if (isLoading) return <p className="text-sm text-gray-400">Loading wishlist…</p>;

  if (error instanceof ApiError && (error.status === 404 || error.status === 409)) {
    return (
      <div className="rounded-md border border-dashed border-gray-300 p-4 text-center text-sm text-gray-500">
        Awaiting draw
      </div>
    );
  }

  if (error) return <p className="text-sm text-red-600">Failed to load wishlist.</p>;

  if (!data || data.items.length === 0) {
    return <p className="text-sm text-gray-500">No wishlist items yet.</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium text-gray-600">{data.assigneeName}'s wishlist</p>
      <ul className="flex flex-col gap-1">
        {data.items.map((item, i) => (
          <li key={i} className="flex items-center gap-2 rounded-md border border-gray-100 bg-gray-50 p-2 text-sm">
            <span className="flex-1 font-medium">{item.name}</span>
            {item.priority && (
              <span className="text-xs text-gray-400">p{item.priority}</span>
            )}
            {item.url && (
              <a
                href={item.url}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-blue-500 hover:underline"
              >
                Link
              </a>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
