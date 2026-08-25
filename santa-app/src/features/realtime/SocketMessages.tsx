import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { messageKeys } from '@/features/messages/api';
import { useSocket } from './useSocket';
import type { IncomingChatMessage } from '@/types/api';

export function SocketMessages() {
  const { socket } = useSocket();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!socket) return;

    function handleMessage(message: IncomingChatMessage) {
      toast(message.text, {
        icon: message.thread === 'giftee' ? '🎁' : '✨',
        description:
          message.thread === 'giftee'
            ? 'New message from your giftee'
            : 'New message from your Secret Santa',
      });
      void queryClient.invalidateQueries({
        queryKey: messageKeys.threads(message.roomId),
      });
    }

    socket.on('message:received', handleMessage);
    return () => {
      socket.off('message:received', handleMessage);
    };
  }, [socket, queryClient]);

  return null;
}
