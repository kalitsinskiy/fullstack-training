import { useQuery } from '@tanstack/react-query'
import { api, ApiError } from '../services/api'

interface Assignment {
  assigneeId: string
  assigneeDisplayName: string
}

interface Props {
  roomId: string
}

export default function MyAssignment({ roomId }: Props) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['rooms', roomId, 'assignment'],
    queryFn: () => api.get<Assignment>(`/api/rooms/${roomId}/assignment`),
    retry: (failureCount, err) => {
      if (err instanceof ApiError && (err.status === 404 || err.status === 409)) return false
      return failureCount < 3
    },
  })

  if (isLoading) return <p className="text-sm text-gray-500">Loading assignment…</p>

  if (error) {
    if (error instanceof ApiError && (error.status === 404 || error.status === 409)) {
      return (
        <div className="rounded-lg border border-dashed border-gray-300 p-4 text-sm text-gray-500">
          Awaiting draw — your assignment will appear here once the room draw happens.
        </div>
      )
    }
    return <p className="text-sm text-red-600">Failed to load assignment.</p>
  }

  return (
    <div className="rounded-lg border border-green-200 bg-green-50 p-4">
      <p className="text-sm font-medium text-green-800">
        Your giftee: <span className="font-semibold">{data?.assigneeDisplayName}</span>
      </p>
    </div>
  )
}
