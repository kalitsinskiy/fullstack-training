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

    function refetchRoom() {
      void queryClient.invalidateQueries({ queryKey: roomKeys.detail(roomId) });
    }

    function refetchRoomAndAssignment() {
      refetchRoom();
      void queryClient.invalidateQueries({
        queryKey: roomKeys.assignment(roomId),
      });
    }

    socket.on('room:member-joined', refetchRoom);
    socket.on('room:draw-completed', refetchRoomAndAssignment);

    return () => {
      leaveRoom(roomId);
      socket.off('room:member-joined', refetchRoom);
      socket.off('room:draw-completed', refetchRoomAndAssignment);
    };
  }, [socket, roomId, joinRoom, leaveRoom, queryClient]);
}
