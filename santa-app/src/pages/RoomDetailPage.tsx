import { useParams } from 'react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../services/api'
import WishlistEditor from '../components/WishlistEditor'
import MyAssignment from '../components/MyAssignment'
import AssigneeWishlist from '../components/AssigneeWishlist'

interface Room {
  id: string
  name: string
  code: string
  members: string[]
  status: 'pending' | 'drawn' | 'closed'
  ownerId: string
}

export default function RoomDetailPage() {
  const { id } = useParams<{ id: string }>()
  const qc = useQueryClient()

  const { data: room, isLoading, error } = useQuery({
    queryKey: ['rooms', id],
    queryFn: () => api.get<Room>(`/api/rooms/${id}`),
    enabled: !!id,
  })

  const drawMutation = useMutation({
    mutationFn: () => api.post(`/api/rooms/${id}/draw`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rooms', id] })
      qc.invalidateQueries({ queryKey: ['rooms', id, 'assignment'] })
      qc.invalidateQueries({ queryKey: ['rooms', id, 'assignment', 'wishlist'] })
    },
    onError: (err) => {
      alert(err instanceof Error ? err.message : 'Draw failed')
    },
  })

  if (!id) return <h1>Room not found</h1>
  if (isLoading) return <p className="p-6 text-gray-500">Loading room…</p>
  if (error) return <p className="p-6 text-red-600">Failed to load room.</p>

  return (
    <div className="p-6 space-y-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-semibold">{room?.name ?? `Room ${id}`}</h1>
        <p className="text-sm text-gray-500 mt-1">
          Code: <span className="font-mono">{room?.code}</span> · {room?.members.length ?? 0} members · {room?.status}
        </p>
      </div>

      {room?.status === 'pending' && (
        <div>
          <button
            type="button"
            onClick={() => drawMutation.mutate()}
            disabled={drawMutation.isPending}
            className="px-4 py-2 text-sm font-medium text-white bg-brand rounded hover:bg-brand-dark disabled:opacity-50"
          >
            {drawMutation.isPending ? 'Drawing…' : 'Trigger Draw'}
          </button>
        </div>
      )}

      <section>
        <h2 className="text-xl font-semibold mb-4">My Wishlist</h2>
        <WishlistEditor roomId={id} />
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4">My Assignment</h2>
        <MyAssignment roomId={id} />
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4">Giftee's Wishlist</h2>
        <AssigneeWishlist roomId={id} />
      </section>
    </div>
  )
}
