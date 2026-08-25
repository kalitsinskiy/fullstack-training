import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '@/lib/api';
import type { ChatMessage, MessageThread, MessageThreads } from '@/types/api';

export const MAX_MESSAGE_LENGTH = 500;

export const messageKeys = {
  all: () => ['messages'] as const,
  threads: (roomId: string) => ['messages', roomId] as const,
};

export interface SendMessageInput {
  to: MessageThread;
  text: string;
}

export function useMessageThreads(roomId: string) {
  return useQuery({
    queryKey: messageKeys.threads(roomId),
    queryFn: async () => {
      const { data } = await notificationsApi.get<MessageThreads>(
        `/api/messages/${roomId}`,
      );
      return data;
    },
    enabled: Boolean(roomId),
  });
}

export function useSendMessage(roomId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ to, text }: SendMessageInput) => {
      const { data } = await notificationsApi.post<ChatMessage>('/api/messages', {
        roomId,
        to,
        text,
      });
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: messageKeys.threads(roomId),
      });
    },
  });
}
