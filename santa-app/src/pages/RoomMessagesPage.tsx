import { FormEvent, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Gift, Send, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { api, getApiErrorMessage } from '@/lib/api';
import { useSocket } from '@/features/realtime/useSocket';
import {
  listMessages,
  sendMessage,
  type IncomingMessage,
  type RoomThreads,
  type ThreadMessage,
  type ThreadSide,
} from '@/features/messages/messagesApi';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { RoomDetail } from '@/types/api';

export function RoomMessagesPage() {
  const { id = '' } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const socket = useSocket();
  const [side, setSide] = useState<ThreadSide>('giftee');
  const [text, setText] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  const roomQuery = useQuery({
    queryKey: ['room', id],
    queryFn: async () => (await api.get<RoomDetail>(`/api/rooms/${id}`)).data,
    retry: false,
  });

  const threadsQuery = useQuery({
    queryKey: ['messages', id],
    queryFn: () => listMessages(id),
  });
  const threads = threadsQuery.data;
  const active = side === 'giftee' ? threads?.giftee : threads?.santa;
  const messages = active?.messages ?? [];
  const gifteeName = threads?.giftee?.name ?? 'Your giftee';

  // Live delivery: drop each incoming message into the chat it belongs to.
  useEffect(() => {
    if (!socket) return;
    const onMessage = (msg: IncomingMessage) => {
      if (msg.roomId !== id) return;
      qc.setQueryData<RoomThreads>(['messages', id], (prev) => {
        if (!prev) return prev;
        const append = (list: ThreadMessage[]) =>
          list.some((m) => m.id === msg.id) ? list : [...list, msg];
        if (msg.thread === 'giftee' && prev.giftee) {
          return { ...prev, giftee: { ...prev.giftee, messages: append(prev.giftee.messages) } };
        }
        if (msg.thread === 'santa' && prev.santa) {
          return { ...prev, santa: { messages: append(prev.santa.messages) } };
        }
        return prev;
      });
    };
    socket.on('message:received', onMessage);
    return () => {
      socket.off('message:received', onMessage);
    };
  }, [socket, id, qc]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, side]);

  const send = useMutation({
    mutationFn: () => sendMessage({ roomId: id, to: side, text: text.trim() }),
    onSuccess: (msg) => {
      qc.setQueryData<RoomThreads>(['messages', id], (prev) => {
        if (!prev) return prev;
        if (msg.thread === 'giftee' && prev.giftee) {
          return { ...prev, giftee: { ...prev.giftee, messages: [...prev.giftee.messages, msg] } };
        }
        if (msg.thread === 'santa' && prev.santa) {
          return { ...prev, santa: { messages: [...prev.santa.messages, msg] } };
        }
        return prev;
      });
      setText('');
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Could not send message')),
  });

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!text.trim() || send.isPending) return;
    send.mutate();
  };

  if (roomQuery.isError) {
    return (
      <PageHeader
        title="Room not found"
        description="It doesn't exist, or you're not a participant."
      />
    );
  }

  const room = roomQuery.data;
  const ready = !!threads?.giftee || !!threads?.santa;
  const canSend = !!active;

  return (
    <>
      <PageHeader
        title={room ? `Messages · ${room.name}` : 'Messages'}
        description="Two private chats: one with the giftee you drew, one with your own anonymous Secret Santa."
        action={
          <Button variant="outline" asChild>
            <Link to={`/rooms/${id}`}>
              <ArrowLeft /> Back to room
            </Link>
          </Button>
        }
      />

      {!threadsQuery.isLoading && !ready ? (
        <p className="text-sm text-muted-foreground">
          Messaging opens once the room's draw is done.
        </p>
      ) : (
        <div className="mx-auto flex max-w-2xl flex-col gap-3">
          {/* Chat switcher — names depend on the relationship */}
          <div className="grid grid-cols-2 gap-1 rounded-lg border border-border p-1">
            <button
              type="button"
              onClick={() => setSide('giftee')}
              className={cn(
                'flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                side === 'giftee'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted',
              )}
            >
              <Gift className="size-4" /> {gifteeName}
            </button>
            <button
              type="button"
              onClick={() => setSide('santa')}
              className={cn(
                'flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                side === 'santa'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted',
              )}
            >
              <Sparkles className="size-4" /> Your Secret Santa
            </button>
          </div>

          <div className="flex h-[55vh] flex-col rounded-lg border border-border">
            <div className="flex-1 space-y-2 overflow-y-auto p-4">
              {threadsQuery.isLoading ? (
                <p className="text-sm text-muted-foreground">Loading…</p>
              ) : messages.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  {side === 'giftee'
                    ? `No messages with ${gifteeName} yet. Say hi — they won't know it's you.`
                    : 'No messages from your Secret Santa yet. You can write to them anonymously.'}
                </p>
              ) : (
                messages.map((m) => (
                  <div
                    key={m.id}
                    className={cn('flex', m.direction === 'out' ? 'justify-end' : 'justify-start')}
                  >
                    <div
                      className={cn(
                        'max-w-[75%] rounded-2xl px-4 py-2 text-sm',
                        m.direction === 'out'
                          ? 'rounded-br-sm bg-primary text-primary-foreground'
                          : 'rounded-bl-sm bg-muted text-foreground',
                      )}
                    >
                      <p className="whitespace-pre-wrap break-words">{m.text}</p>
                      <p
                        className={cn(
                          'mt-1 text-[10px] opacity-70',
                          m.direction === 'out' ? 'text-right' : 'text-left',
                        )}
                      >
                        {new Date(m.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <div ref={bottomRef} />
            </div>

            <form onSubmit={onSubmit} className="flex gap-2 border-t border-border p-3">
              <Input
                value={text}
                onChange={(e) => setText(e.target.value)}
                maxLength={500}
                disabled={!canSend}
                placeholder={
                  side === 'giftee'
                    ? `Message ${gifteeName}…`
                    : 'Message your Secret Santa…'
                }
              />
              <Button type="submit" disabled={!canSend || !text.trim() || send.isPending}>
                <Send /> Send
              </Button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
