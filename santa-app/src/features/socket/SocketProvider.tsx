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
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  // Rooms this client wants to be in. socket.io auto-reconnects spin up a fresh
  // server-side connection with no room memberships, so we replay these on
  // every 'connect' — otherwise a blip silently stops room:* events.
  const joinedRoomsRef = useRef<Set<string>>(new Set());

  const joinRoom = useCallback((roomId: string) => {
    joinedRoomsRef.current.add(roomId);
    socketRef.current?.emit('join-room', roomId);
  }, []);

  const leaveRoom = useCallback((roomId: string) => {
    joinedRoomsRef.current.delete(roomId);
    socketRef.current?.emit('leave-room', roomId);
  }, []);

  useEffect(() => {
    const token = tokenStore.get();
    if (!token) return;

    const socket = io(import.meta.env.VITE_WS_URL || undefined, {
      auth: { token },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 10,
    });

    socket.on('connect', () => {
      setIsConnected(true);
      // Re-join every room after a (re)connect; the server only auto-joins
      // user:{id}, so room memberships must be restored by the client.
      for (const roomId of joinedRoomsRef.current) {
        socket.emit('join-room', roomId);
      }
    });
    socket.on('disconnect', () => setIsConnected(false));
    socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err.message);
      if (err.message === 'Invalid or expired token') {
        socket.disconnect();
      }
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    };
  }, []);

  return (
    <SocketContext.Provider
      value={{ socket: socketRef.current, isConnected, joinRoom, leaveRoom }}
    >
      {children}
    </SocketContext.Provider>
  );
}
