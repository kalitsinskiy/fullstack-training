import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import type { Room, Paginated } from '@/types/api';
import { RoomList } from '@/components/RoomList/RoomList';

export function RoomsPage() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['rooms'],
    queryFn: ({ signal }) => api.get<Paginated<Room>>('/api/rooms', { signal }),
  });

  if (isLoading)
    return (
      <p className="text-muted-foreground px-[clamp(1rem,4vw,3rem)] pt-[clamp(1.5rem,4vw,3rem)]">
        Loading rooms...
      </p>
    );
  if (isError)
    return (
      <p role="alert" className="p-6 text-red-500">
        {(error as Error).message}
      </p>
    );

  return <RoomList rooms={data?.data ?? []} />;
}
