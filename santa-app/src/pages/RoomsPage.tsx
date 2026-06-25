import { useNavigate } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { api } from '../services/api'
import RoomList from '../components/RoomList'

interface Room {
  id: string
  name: string
  code: string
  members: string[]
  status: 'pending' | 'drawn' | 'closed'
}

interface RoomsResponse {
  data: Room[]
  meta: { total: number; page: number; limit: number; totalPages: number }
}

export default function RoomsPage() {
  const navigate = useNavigate()

  const { data, isLoading, error } = useQuery({
    queryKey: ['rooms'],
    queryFn: () => api.get<RoomsResponse>('/api/rooms'),
  })

  if (isLoading) return <p className="p-6 text-gray-500">Loading rooms…</p>
  if (error) return <p className="p-6 text-red-600">Failed to load rooms.</p>

  const rooms = (data?.data ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    code: r.code,
    memberCount: r.members.length,
    status: r.status,
  }))

  return (
    <div className="p-6">
      <RoomList
        rooms={rooms}
        onJoinRoom={(id) => navigate(`/rooms/${id}`)}
      />
    </div>
  )
}
