import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type {
  Wishlist,
  Assignment,
  CreateRoomInput,
  Paginated,
  RoomDetail,
  RoomSummary,
  UpdateRoomInput,
} from '@/types/api';
import { cleanWishlistItems } from './helpers';

const roomsKey = ['rooms'] as const;
const roomKey = (id: string) => ['rooms', id] as const;
const wishlistKey = (roomId: string, userId: string) =>
  ['rooms', roomId, 'wishlist', userId] as const;

export function useRooms(page = 1, limit = 20) {
  return useQuery({
    queryKey: [...roomsKey, page, limit],
    queryFn: async () =>
      (
        await api.get<Paginated<RoomSummary>>(
          `/api/rooms?page=${page}&limit=${limit}`,
        )
      ).data,
  });
}

export function useRoom(id: string | undefined) {
  return useQuery({
    queryKey: roomKey(id ?? ''),
    queryFn: async () => (await api.get<RoomDetail>(`/api/rooms/${id}`)).data,
    enabled: !!id,
  });
}

export function useCreateRoom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateRoomInput) =>
      (await api.post<RoomDetail>('/api/rooms', input)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: roomsKey }),
  });
}

export function useJoinRoom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (inviteCode: string) =>
      (await api.post('/api/rooms/join', { inviteCode })).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: roomsKey }),
  });
}

export function useWishlist(
  roomId: string | undefined,
  userId: string | undefined,
) {
  return useQuery({
    queryKey: wishlistKey(roomId ?? '', userId ?? ''),
    queryFn: async () =>
      (await api.get<Wishlist>(`/api/rooms/${roomId}/wishlist/${userId}`)).data,
    enabled: !!roomId && !!userId,
  });
}

export function useSaveWishlist(roomId: string, userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (items: string[]) =>
      (
        await api.put<Wishlist>(`/api/rooms/${roomId}/wishlist`, {
          items: cleanWishlistItems(items),
        })
      ).data,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: wishlistKey(roomId, userId) }),
  });
}

export function useDraw(roomId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (exchangeDate: string) =>
      (
        await api.post<RoomDetail>(`/api/rooms/${roomId}/draw`, {
          exchangeDate,
        })
      ).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roomKey(roomId) });
      queryClient.invalidateQueries({
        queryKey: [...roomKey(roomId), 'assignment'],
      });
    },
  });
}

export function useAssignment(roomId: string, enabled: boolean) {
  return useQuery({
    queryKey: [...roomKey(roomId), 'assignment'],
    queryFn: async () =>
      (await api.get<Assignment>(`/api/rooms/${roomId}/assignment`)).data,
    enabled,
  });
}

export function useEditRoom(roomId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateRoomInput) =>
      (await api.patch<RoomDetail>(`/api/rooms/${roomId}`, input)).data,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: roomKey(roomId) }),
  });
}

export function useDeleteRoom(roomId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await api.delete(`/api/rooms/${roomId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roomsKey });
      queryClient.invalidateQueries({ queryKey: roomKey(roomId) });
    },
  });
}

export function useKickMember(roomId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      await api.delete(`/api/rooms/${roomId}/members/${userId}`);
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: roomKey(roomId) }),
  });
}

export function useRegenerateInvite(roomId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () =>
      (
        await api.post<RoomDetail>(
          `/api/rooms/${roomId}/invite-code/regenerate`,
        )
      ).data,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: roomKey(roomId) }),
  });
}
