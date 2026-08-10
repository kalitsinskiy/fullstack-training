import { BackLink } from '@/components/BackLink';
import { EmptyState } from '@/components/EmptyState';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useRoom } from '@/features/rooms/hooks';
import {
  useSendMessage,
  useThreads,
  useMarkThreadRead,
} from '@/features/messages/hooks';
import { useSocket } from '@/features/socket/SocketContext';
import { cn } from '@/lib/utils';
import type {
  ChatMessage,
  IncomingMessage,
  MessageThreadKey,
} from '@/types/api';
import { format } from 'date-fns';
import { Gift, MessageCircle, Send } from 'lucide-react';
import { FormEvent, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';

export function RoomMessagesPage() {
  const { id } = useParams<{ id: string }>();
  const { data: room } = useRoom(id);
  const [tab, setTab] = useState<MessageThreadKey>('giftee');
  const [text, setText] = useState('');
  const { data, isLoading, isError, refetch } = useThreads(id);
  const send = useSendMessage(id ?? '');
  const { socket } = useSocket();
  const bottomRef = useRef<HTMLDivElement>(null);
  const markRead = useMarkThreadRead(id ?? '');
  const markThreadRead = markRead.mutate;
  const markedRef = useRef<string>('');

  useEffect(() => {
    if (!id || !data) return;

    const exists = tab === 'giftee' ? !!data.giftee : !!data.santa;
    const key = `${id}:${tab}`;

    if (!exists || markedRef.current === key) return;

    markedRef.current = key;
    markRead.mutate(tab);
  }, [id, tab, data, markRead]);

  useEffect(() => {
    if (!socket) return;

    const onMessage = (payload: IncomingMessage) => {
      void refetch();
      if (payload.roomId === id && payload.thread === tab) markThreadRead(tab);
    };

    socket.on('message:received', onMessage);

    return () => {
      socket.off('message:received', onMessage);
    };
  }, [socket, refetch, id, tab, markThreadRead]);

  const active: ChatMessage[] =
    (tab === 'giftee' ? data?.giftee?.messages : data?.santa?.messages) ?? [];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' });
  }, [active.length, tab]);

  function onSubmit(e: FormEvent) {
    e.preventDefault();

    const body = text.trim();

    if (!body) return;

    // Only clear the composer once the send actually succeeded — the previous
    // version cleared it inside a try that could still have thrown.
    send.mutate({ to: tab, text: body }, { onSuccess: () => setText('') });
  }

  if (isLoading)
    return <p className="text-sm text-muted-foreground">Loading chats...</p>;

  if (isError || (!data?.giftee && !data?.santa)) {
    return (
      <>
        <BackLink id={id} destinationText="room" />
        <EmptyState
          icon={MessageCircle}
          title="Messaging isn't available yet"
          description="Once the draw is done you can chat with your giftee and your Secret Santa."
        />
      </>
    );
  }

  return (
    <>
      <BackLink id={id} destinationText="room" />
      <PageHeader
        title={`Messages${room?.name ? ` | ${room.name}` : ''}`}
        description="Two private chats: one with the giftee you drew, one with your own anonymous Secret Santa."
      />

      <div className="mb-4 flex gap-2">
        <Button
          variant={tab === 'giftee' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setTab('giftee')}
          disabled={!data?.giftee}
        >
          <Gift className="size-4" />
          {data?.giftee ? data.giftee.name : 'Your giftee'}
        </Button>
        <Button
          variant={tab === 'santa' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setTab('santa')}
          disabled={!data?.santa}
        >
          Your Secret Santa
        </Button>
      </div>

      <Card className="flex h-[60vh] flex-col p-4">
        <div className="flex-1 space-y-2 overflow-y-auto">
          {active.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No messages yet — say hello 👋
            </p>
          )}

          {active.map((m) => (
            <div
              key={m.id}
              className={cn(
                'flex',
                m.direction === 'out' ? 'justify-end' : 'justify-start',
              )}
            >
              <div
                className={cn(
                  'max-w-[75%] rounded-lg px-3 py-2 text-sm',
                  m.direction === 'out'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-foreground',
                )}
              >
                <p className="whitespace-pre-wrap break-words">{m.text}</p>
                <p className="mt-1 text-[10px] opacity-70">
                  {format(new Date(m.createdAt), 'HH:mm')}
                </p>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={onSubmit} className="mt-3 flex gap-2">
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={
              tab === 'giftee'
                ? 'Send a hint…'
                : 'Reply to your Secret Santa...'
            }
            maxLength={500}
            aria-label="Message"
          />
          <Button
            type="submit"
            size="default"
            disabled={!text.trim() || send.isPending}
            aria-label="Send message"
          >
            <Send className="size-4" /> Send
          </Button>
        </form>
      </Card>
    </>
  );
}
