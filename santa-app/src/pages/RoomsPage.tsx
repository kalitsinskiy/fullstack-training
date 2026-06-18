import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import type { Room, Paginated } from '@/types/api';
import { RoomList } from '@/components/RoomList/RoomList';
import { StatusMessage } from '@/components/ui/StatusMessage/StatusMessage';

export function RoomsPage() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['rooms'],
    queryFn: ({ signal }) => api.get<Paginated<Room>>('/api/rooms', { signal }),
  });

  if (isLoading) return <StatusMessage>Loading rooms...</StatusMessage>;
  if (isError) return <StatusMessage variant="error">{(error as Error).message}</StatusMessage>;

  return <RoomList rooms={data?.data ?? []} />;
}
