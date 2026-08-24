import type { Server } from 'socket.io';

let _io: Server | null = null;

export function setIo(io: Server): void {
  _io = io;
}

export function getIo(): Server {
  if (!_io) throw new Error('Socket.IO server not initialized');
  return _io;
}
