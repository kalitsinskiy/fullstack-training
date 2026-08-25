import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { roomKeys } from '@/features/rooms/api';
import { useSocket } from './useSocket';

export function useRoomRealtime(roomId: string) {
  const { socket, joinRoom, leaveRoom } = useSocket();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!socket || !roomId) return;

    joinRoom(roomId);

    // socket.io auto-reconnect gives us the same Socket instance but a new
    // server-side connection, whose room memberships are gone — rejoin on
    // every 'connect' (including reconnects) or the socket silently stops
    // receiving room events after any connection blip.
    function rejoinRoom() {
      joinRoom(roomId);
    }

    function refetchRoom() {
      // exact: true — invalidateQueries prefix-matches by default, and
      // ['room', roomId] would otherwise also match the wishlist query key
      // (['room', roomId, 'wishlist', userId]), wiping in-progress edits.
      void queryClient.invalidateQueries({
        queryKey: roomKeys.detail(roomId),
        exact: true,
      });
    }

    function refetchRoomAndAssignment() {
      refetchRoom();
      void queryClient.invalidateQueries({
        queryKey: roomKeys.assignment(roomId),
      });
    }

    socket.on('connect', rejoinRoom);
    socket.on('room:member-joined', refetchRoom);
    socket.on('room:draw-completed', refetchRoomAndAssignment);

    return () => {
      leaveRoom(roomId);
      socket.off('connect', rejoinRoom);
      socket.off('room:member-joined', refetchRoom);
      socket.off('room:draw-completed', refetchRoomAndAssignment);
    };
  }, [socket, roomId, joinRoom, leaveRoom, queryClient]);
}
