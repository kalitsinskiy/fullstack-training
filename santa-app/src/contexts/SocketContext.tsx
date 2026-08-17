import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { tokenStore } from '@/lib/api';
import { useAuth } from '@/features/auth/useAuth';

interface SocketContextValue {
  socket: Socket | null;
  isConnected: boolean;
  joinRoom: (roomId: string) => void;
  leaveRoom: (roomId: string) => void;
}

const SocketContext = createContext<SocketContextValue>({
  socket: null,
  isConnected: false,
  joinRoom: () => {},
  leaveRoom: () => {},
});

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const joinedRooms = useRef(new Set<string>());

  useEffect(() => {
    const token = tokenStore.get();
    if (!token) return;

    const s = io(import.meta.env.VITE_WS_URL || undefined, {
      auth: { token },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 10,
    });

    s.on('connect', () => {
      setIsConnected(true);
      // Re-join all rooms after every reconnect
      joinedRooms.current.forEach((roomId) => s.emit('join-room', roomId));
    });
    s.on('disconnect', () => setIsConnected(false));
    s.on('connect_error', (err) => {
      if (err.message === 'Invalid or expired token') {
        s.disconnect();
      }
    });

    setSocket(s);

    return () => {
      s.disconnect();
      setSocket(null);
    };
  }, [isAuthenticated]);

  const joinRoom = useCallback((roomId: string) => {
    joinedRooms.current.add(roomId);
    socket?.emit('join-room', roomId);
  }, [socket]);

  const leaveRoom = useCallback((roomId: string) => {
    joinedRooms.current.delete(roomId);
    socket?.emit('leave-room', roomId);
  }, [socket]);

  return (
    <SocketContext.Provider value={{ socket, isConnected, joinRoom, leaveRoom }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}
