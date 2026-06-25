import { useQuery } from '@tanstack/react-query'
import { api, ApiError } from '../services/api'

interface WishlistItem {
  name: string
  url?: string
  priority?: number
}

interface AssigneeWishlistData {
  items: WishlistItem[]
}

interface Props {
  roomId: string
}

export default function AssigneeWishlist({ roomId }: Props) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['rooms', roomId, 'assignment', 'wishlist'],
    queryFn: () => api.get<AssigneeWishlistData>(`/api/rooms/${roomId}/assignment/wishlist`),
    retry: (failureCount, err) => {
      if (err instanceof ApiError && (err.status === 404 || err.status === 409)) return false
      return failureCount < 3
    },
  })

  if (isLoading) return <p className="text-sm text-gray-500">Loading wishlist…</p>

  if (error) {
    if (error instanceof ApiError && (error.status === 404 || error.status === 409)) {
      return (
        <div className="rounded-lg border border-dashed border-gray-300 p-4 text-sm text-gray-500">
          Awaiting draw — your giftee's wishlist will appear here after the draw.
        </div>
      )
    }
    return <p className="text-sm text-red-600">Failed to load giftee's wishlist.</p>
  }

  if (!data?.items.length) {
    return <p className="text-sm text-gray-500">Your giftee hasn't added any items yet.</p>
  }

  return (
    <ul className="space-y-2">
      {data.items.map((item, idx) => (
        <li key={idx} className="rounded-lg border border-gray-200 p-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-medium text-gray-900">{item.name}</p>
              {item.url && (
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:underline"
                >
                  {item.url}
                </a>
              )}
            </div>
            {item.priority && (
              <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                P{item.priority}
              </span>
            )}
          </div>
        </li>
      ))}
    </ul>
  )
}
