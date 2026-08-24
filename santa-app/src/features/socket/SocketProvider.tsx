import { useCallback, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { tokenStore } from '@/lib/api';
import { SocketContext } from './SocketContext';

export interface SocketContextValue {
  socket: Socket | null;
  isConnected: boolean;
  joinRoom: (roomId: string) => void;
  leaveRoom: (roomId: string) => void;
}

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const joinedRoomsRef = useRef<Set<string>>(new Set());

  const joinRoom = useCallback(
    (roomId: string) => {
      joinedRoomsRef.current.add(roomId);
      socket?.emit('join-room', roomId);
    },
    [socket],
  );

  const leaveRoom = useCallback(
    (roomId: string) => {
      joinedRoomsRef.current.delete(roomId);
      socket?.emit('leave-room', roomId);
    },
    [socket],
  );

  useEffect(() => {
    const token = tokenStore.get();
    if (!token) return;

    const instance = io(import.meta.env.VITE_WS_URL || undefined, {
      auth: { token },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 10,
    });

    instance.on('connect', () => {
      setIsConnected(true);
      // Re-join every room after a (re)connect; the server only auto-joins
      // user:{id}, so room memberships must be restored by the client.
      for (const roomId of joinedRoomsRef.current) {
        instance.emit('join-room', roomId);
      }
    });
    instance.on('disconnect', () => setIsConnected(false));
    instance.on('connect_error', (err) => {
      console.error('Socket connection error:', err.message);
      if (err.message === 'Invalid or expired token') {
        instance.disconnect();
      }
    });

    setSocket(instance);

    return () => {
      instance.disconnect();
      setSocket(null);
      setIsConnected(false);
    };
  }, []);

  return (
    <SocketContext.Provider
      value={{ socket, isConnected, joinRoom, leaveRoom }}
    >
      {children}
    </SocketContext.Provider>
  );
}
