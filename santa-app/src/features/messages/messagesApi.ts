import { notifApi } from '@/features/notifications/notifApi';

export type ThreadSide = 'giftee' | 'santa';

// A message in a thread. The server NEVER sends senderId — `direction` tells us
// whether it's ours (out) or the other party's (in).
export interface ThreadMessage {
  id: string;
  roomId: string;
  text: string;
  createdAt: string;
  direction: 'in' | 'out';
}

// Incoming socket payload also carries which of your two chats it belongs to.
export interface IncomingMessage extends ThreadMessage {
  thread: ThreadSide;
}

export interface RoomThreads {
  // Your giftee — named, because you're allowed to know who you're gifting.
  giftee: { id: string; name: string; messages: ThreadMessage[] } | null;
  // Your Secret Santa — anonymous, never named.
  santa: { messages: ThreadMessage[] } | null;
}

export async function listMessages(roomId: string): Promise<RoomThreads> {
  const res = await notifApi.get<RoomThreads>(`/api/messages/${roomId}`);
  return res.data;
}

export async function sendMessage(input: {
  roomId: string;
  to: ThreadSide;
  text: string;
}): Promise<IncomingMessage> {
  const res = await notifApi.post<IncomingMessage>('/api/messages', input);
  return res.data;
}
