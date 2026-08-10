import { notificationsApi } from '@/lib/notificationsApi';
import type {
  MessageThreadKey,
  MessageThreads,
  SendMessageInput,
  UnreadMessages,
} from '@/types/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export const messageKey = (roomId: string) =>
  ['rooms', roomId, 'messages'] as const;

export const unreadMessagesKey = ['messages', 'unread'] as const;

export function useThreads(roomId: string | undefined) {
  return useQuery({
    queryKey: messageKey(roomId ?? ''),
    queryFn: async () =>
      (await notificationsApi.get<MessageThreads>(`/api/messages/${roomId}`))
        .data,
    enabled: !!roomId,
  });
}

export function useSendMessage(roomId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    meta: { errorMessage: 'Could not send the message' },
    mutationFn: async (input: Omit<SendMessageInput, 'roomId'>) =>
      (await notificationsApi.post('/api/messages', { roomId, ...input })).data,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: messageKey(roomId) }),
  });
}

export function useUnreadMessages() {
  return useQuery({
    queryKey: unreadMessagesKey,
    queryFn: async () =>
      (await notificationsApi.get<UnreadMessages>('/api/messages/unread')).data,
    refetchInterval: 30_000,
  });
}

export function useMarkThreadRead(roomId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    meta: { silentError: true },
    mutationFn: async (thread?: MessageThreadKey) =>
      (
        await notificationsApi.patch(
          `/api/messages/${roomId}/read`,
          thread ? { thread } : {},
        )
      ).data,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: unreadMessagesKey }),
  });
}
