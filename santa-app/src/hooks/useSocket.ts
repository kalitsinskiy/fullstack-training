import { useCallback } from 'react';
import { useSocketContext } from '@/features/socket/SocketContext';

export function useSocket() {
  const { socket, isConnected } = useSocketContext();

  const joinRoom = useCallback(
    (roomId: string) => {
      socket?.emit('join-room', roomId);
    },
    [socket],
  );

  const leaveRoom = useCallback(
    (roomId: string) => {
      socket?.emit('leave-room', roomId);
    },
    [socket],
  );

  return { socket, isConnected, joinRoom, leaveRoom };
}
