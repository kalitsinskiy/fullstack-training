import { useQuery } from '@tanstack/react-query';
import { api, ApiError } from '@/services/api';
import type { Wishlist } from '@/types/api';

export function useAssigneeWishlist(roomId: string, userId: string | undefined) {
  return useQuery({
    queryKey: ['rooms', roomId, 'wishlist', userId],
    queryFn: async ({ signal }) => {
      try {
        return await api.get<Wishlist>(`/api/rooms/${roomId}/wishlist/${userId}`, { signal });
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) {
          return { roomId, userId: userId!, items: [] } as Wishlist;
        }
        throw err;
      }
    },
    enabled: !!roomId && !!userId,
  });
}
