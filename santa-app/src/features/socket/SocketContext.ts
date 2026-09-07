import { createContext, useContext } from 'react';
import type { Socket } from 'socket.io-client';

export interface SocketContextValue {
  socket: Socket | null;
  isConnected: boolean;
  joinRoom: (roomId: string) => void;
  leaveRoom: (roomId: string) => void;
}

export const SocketContext = createContext<SocketContextValue | null>(null);

export function useSocket(): SocketContextValue {
  const ctx = useContext(SocketContext);

  if (!ctx) {
    return {
      socket: null,
      isConnected: false,
      joinRoom: () => {},
      leaveRoom: () => {},
    };
  }
  return ctx;
}
