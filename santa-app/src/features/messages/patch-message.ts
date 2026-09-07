import type {
  ChatMessage,
  MessageThreadKey,
  MessageThreads,
} from '@/types/api';

export function patchMessage(
  prev: MessageThreads | undefined,
  thread: MessageThreadKey,
  id: string,
  patch: Partial<ChatMessage>,
) {
  if (!prev) return prev;

  const target = prev[thread];

  if (!target) return prev;

  let found = false;

  const messages = target.messages.map((m) => {
    if (m.id !== id) return m;

    found = true;

    return { ...m, ...patch };
  });

  if (!found) return prev;

  return { ...prev, [thread]: { ...target, messages } };
}
