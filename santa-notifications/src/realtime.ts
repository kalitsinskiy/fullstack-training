import type { Server as IOServer } from 'socket.io';

// The Socket.IO server is created at startup (server.ts), after the route tree
// is built. Routes that need to push live (e.g. POST /messages) read it lazily
// through this tiny registry instead of being constructed with `io` in hand.
let io: IOServer | null = null;

export function setIO(server: IOServer): void {
  io = server;
}

export function getIO(): IOServer | null {
  return io;
}
