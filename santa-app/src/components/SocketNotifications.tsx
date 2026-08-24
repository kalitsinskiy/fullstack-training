import { useEffect } from 'react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { useSocket } from '@/hooks/useSocket';
import { useUnreadMessages } from '@/features/messages/useUnreadMessages';

interface NotificationPayload {
  id: string;
  type: string;
  message: string;
  roomId?: string;
  createdAt: string;
}

interface MessagePayload {
  id: string;
  roomId: string;
  text: string;
  createdAt: string;
  direction: 'in' | 'out';
  thread: 'giftee' | 'santa';
}

function iconFor(type: string): string {
  switch (type) {
    case 'draw.completed':
      return '🎉';
    case 'user.joined':
      return '👋';
    case 'wishlist.updated':
      return '🎁';
    default:
      return '🔔';
  }
}

export function SocketNotifications() {
  const { socket } = useSocket();
  const queryClient = useQueryClient();
  const { increment } = useUnreadMessages();

  useEffect(() => {
    if (!socket) return;

    const handleNotification = (payload: NotificationPayload) => {
      toast(payload.message, { icon: iconFor(payload.type) });
      void queryClient.invalidateQueries({ queryKey: ['notifications'] });
    };

    const handleMessage = (payload: MessagePayload) => {
      const label =
        payload.thread === 'santa' ? 'Your Secret Santa' : 'Your giftee';
      toast(`New message from ${label}`, { icon: '✉️' });
      increment(payload.roomId);
    };

    socket.on('notification', handleNotification);
    socket.on('message:received', handleMessage);
    return () => {
      socket.off('notification', handleNotification);
      socket.off('message:received', handleMessage);
    };
  }, [socket, queryClient, increment]);

  return null;
}
