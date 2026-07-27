import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { notificationKeys } from '@/features/notifications/api';
import { useSocket } from './useSocket';
import type { Notification } from '@/types/api';

const ICONS: Record<string, string> = {
  'room.created': '🎄',
  'user.joined': '👋',
  'draw.completed': '🎉',
  'wishlist.updated': '📝',
  room_invite: '✉️',
  assignment: '🎁',
  wishlist_update: '📝',
};

function iconFor(type: string): string {
  return ICONS[type] ?? '🔔';
}

export function SocketNotifications() {
  const { socket } = useSocket();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!socket) return;

    function handleNotification(notification: Notification) {
      toast(notification.message, { icon: iconFor(notification.type) });
      void queryClient.invalidateQueries({ queryKey: notificationKeys.all() });
    }

    socket.on('notification', handleNotification);
    return () => {
      socket.off('notification', handleNotification);
    };
  }, [socket, queryClient]);

  return null;
}
