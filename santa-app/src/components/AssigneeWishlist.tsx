import { useOptimistic, useTransition, useState } from 'react'
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

type BoughtState = Record<number, boolean>

export default function AssigneeWishlist({ roomId }: Props) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['rooms', roomId, 'assignment', 'wishlist'],
    queryFn: () => api.get<AssigneeWishlistData>(`/api/rooms/${roomId}/assignment/wishlist`),
    retry: (failureCount, err) => {
      if (err instanceof ApiError && (err.status === 404 || err.status === 409)) return false
      return failureCount < 3
    },
    throwOnError: false,
  })

  const [committed, setCommitted] = useState<BoughtState>({})
  const [optimistic, setOptimistic] = useOptimistic<BoughtState, number>(
    committed,
    (state, idx) => ({ ...state, [idx]: !state[idx] }),
  )

  const [isPending, startTransition] = useTransition()

  const handleToggle = (idx: number) => {
    startTransition(async () => {
      setOptimistic(idx)
      await new Promise<void>((r) => setTimeout(r, 400))
      setCommitted((s) => ({ ...s, [idx]: !s[idx] }))
    })
  }

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
        <li
          key={idx}
          className={`rounded-lg border p-3 transition-colors ${optimistic[idx] ? 'border-green-200 bg-green-50' : 'border-gray-200'}`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-3">
              <form
                action={() => handleToggle(idx)}
              >
                <button
                  type="submit"
                  aria-label={optimistic[idx] ? 'Unmark as bought' : 'Mark as bought'}
                  className="mt-0.5 h-4 w-4 rounded border border-gray-400 bg-white checked:bg-green-500 flex items-center justify-center hover:border-green-500"
                >
                  {optimistic[idx] && (
                    <svg viewBox="0 0 12 12" fill="none" className="h-3 w-3 text-green-600" stroke="currentColor" strokeWidth="2">
                      <path d="M2 6l3 3 5-5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>
              </form>
              <div>
                <p className={`text-sm font-medium ${optimistic[idx] ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                  {item.name}
                </p>
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
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {isPending && optimistic[idx] !== committed[idx] && (
                <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-700">
                  saving…
                </span>
              )}
              {optimistic[idx] && (
                <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                  bought
                </span>
              )}
              {item.priority && (
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                  P{item.priority}
                </span>
              )}
            </div>
          </div>
        </li>
      ))}
    </ul>
  )
}
