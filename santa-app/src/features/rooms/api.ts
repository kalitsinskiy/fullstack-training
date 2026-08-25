import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type {
  Assignment,
  Paginated,
  RoomDetail,
  RoomSummary,
  Wishlist,
} from '@/types/api';

export const roomKeys = {
  lists: () => ['rooms'] as const,
  list: (page: number) => ['rooms', { page }] as const,
  detail: (id: string) => ['room', id] as const,
  assignment: (id: string) => ['room', id, 'assignment'] as const,
  wishlist: (id: string, userId: string) =>
    ['room', id, 'wishlist', userId] as const,
};

export interface CreateRoomInput {
  name: string;
  budget?: number;
  currency?: string;
}

export function useRooms(page = 1) {
  return useQuery({
    queryKey: roomKeys.list(page),
    queryFn: async () => {
      const { data } = await api.get<Paginated<RoomSummary>>('/api/rooms', {
        params: { page },
      });
      return data;
    },
  });
}

export function useCreateRoom() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateRoomInput) => {
      const { data } = await api.post<RoomDetail>('/api/rooms', input);
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: roomKeys.lists() });
    },
  });
}

export function useJoinRoom() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (inviteCode: string) => {
      const { data } = await api.post<RoomDetail>('/api/rooms/join', {
        inviteCode,
      });
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: roomKeys.lists() });
    },
  });
}

export function useRoom(id: string) {
  return useQuery({
    queryKey: roomKeys.detail(id),
    queryFn: async () => {
      const { data } = await api.get<RoomDetail>(`/api/rooms/${id}`);
      return data;
    },
    enabled: Boolean(id),
  });
}

/** The caller's giftee — only meaningful once the room is drawn. */
export function useAssignment(id: string, enabled: boolean) {
  return useQuery({
    queryKey: roomKeys.assignment(id),
    queryFn: async () => {
      const { data } = await api.get<Assignment>(`/api/rooms/${id}/assignment`);
      return data;
    },
    enabled: Boolean(id) && enabled,
    retry: false,
  });
}

export function useMyWishlist(id: string, userId: string | undefined) {
  return useQuery({
    queryKey: roomKeys.wishlist(id, userId ?? ''),
    queryFn: async () => {
      const { data } = await api.get<Wishlist>(
        `/api/rooms/${id}/wishlist/${userId}`,
      );
      return data;
    },
    enabled: Boolean(id) && Boolean(userId),
  });
}

export function useSaveWishlist(id: string, userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (items: string[]) => {
      const { data } = await api.put<Wishlist>(`/api/rooms/${id}/wishlist`, {
        items,
      });
      return data;
    },
    onSuccess: () => {
      if (userId) {
        void queryClient.invalidateQueries({
          queryKey: roomKeys.wishlist(id, userId),
        });
      }
    },
  });
}

export function useDrawRoom(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (exchangeDate: string) => {
      const { data } = await api.post<RoomDetail>(`/api/rooms/${id}/draw`, {
        exchangeDate,
      });
      return data;
    },
    onSuccess: (room) => {
      queryClient.setQueryData(roomKeys.detail(id), room);
      void queryClient.invalidateQueries({
        queryKey: roomKeys.assignment(id),
      });
    },
  });
}

export function useDeleteRoom(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await api.delete(`/api/rooms/${id}`);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['rooms'] });
    },
  });
}

export function useKickMember(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (memberId: string) => {
      await api.delete(`/api/rooms/${id}/members/${memberId}`);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: roomKeys.detail(id) });
    },
  });
}

export function useRegenerateInvite(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post<RoomDetail>(
        `/api/rooms/${id}/invite-code/regenerate`,
      );
      return data;
    },
    onSuccess: (room) => {
      queryClient.setQueryData(roomKeys.detail(id), room);
    },
  });
}

export function useChangeExchangeDate(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (exchangeDate: string) => {
      const { data } = await api.patch<RoomDetail>(`/api/rooms/${id}`, {
        exchangeDate,
      });
      return data;
    },
    onSuccess: (room) => {
      queryClient.setQueryData(roomKeys.detail(id), room);
    },
  });
}
