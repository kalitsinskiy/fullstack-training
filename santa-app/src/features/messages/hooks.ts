import { notificationsApi } from '@/lib/notificationsApi';
import type {
  ChatMessage,
  MessageThreadKey,
  MessageThreads,
  SendMessageInput,
  UnreadMessages,
  Reaction,
} from '@/types/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { patchMessage } from './patch-message';

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

export function useToggleReaction(roomId: string, thread: MessageThreadKey) {
  const queryClient = useQueryClient();

  return useMutation({
    meta: { errorMessage: 'Could not save your reaction' },
    mutationFn: async ({ id, emoji }: { id: string; emoji: Reaction | null }) =>
      (
        await notificationsApi.put<ChatMessage>(
          `/api/messages/${id}/reaction`,
          { emoji },
        )
      ).data,

    onMutate: async ({ id, emoji }) => {
      const key = messageKey(roomId);

      await queryClient.cancelQueries({ queryKey: key });

      const previous = queryClient.getQueryData<MessageThreads>(key);

      queryClient.setQueryData<MessageThreads>(key, (prev) =>
        patchMessage(prev, thread, id, { myReaction: emoji }),
      );
      return { previous, key };
    },

    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(ctx.key, ctx.previous);
    },

    onSuccess: (updated) => {
      queryClient.setQueryData<MessageThreads>(messageKey(roomId), (prev) =>
        patchMessage(prev, thread, updated.id, {
          myReaction: updated.myReaction,
          theirReaction: updated.theirReaction,
        }),
      );
    },
  });
}
