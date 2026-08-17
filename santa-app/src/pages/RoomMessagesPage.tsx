import { useState, useEffect, useRef, type FormEvent, type KeyboardEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Gift, Sparkles, ArrowLeft, Send } from 'lucide-react';
import { toast } from 'sonner';
import { notificationsApi } from '@/lib/notificationsApi';
import { api, getApiErrorMessage } from '@/lib/api';
import { useSocket } from '@/contexts/SocketContext';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import type { RoomDetail } from '@/types/api';

type Thread = 'giftee' | 'santa';

interface ChatMessage {
  id: string;
  roomId: string;
  text: string;
  createdAt: string;
  direction: 'in' | 'out';
  thread: Thread;
}

interface MessagesResponse {
  giftee: { id: string; name: string | null; messages: ChatMessage[] } | null;
  santa: { messages: ChatMessage[] } | null;
}

function Bubble({ msg }: { msg: ChatMessage }) {
  const isOut = msg.direction === 'out';
  return (
    <div className={`flex ${isOut ? 'justify-end' : 'justify-start'} mb-2`}>
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-2.5 shadow-sm ${
          isOut
            ? 'rounded-br-sm bg-primary text-primary-foreground'
            : 'rounded-bl-sm bg-muted text-foreground'
        }`}
      >
        <p className="text-[15px] leading-snug">{msg.text}</p>
        <p
          className={`mt-1 text-[11px] text-right ${
            isOut ? 'text-primary-foreground/70' : 'text-muted-foreground'
          }`}
        >
          {new Date(msg.createdAt).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </div>
    </div>
  );
}

export function RoomMessagesPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { socket } = useSocket();

  const [activeThread, setActiveThread] = useState<Thread>('giftee');
  const [text, setText] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: room } = useQuery<RoomDetail>({
    queryKey: ['rooms', roomId],
    queryFn: () => api.get<RoomDetail>(`/api/rooms/${roomId}`).then((r) => r.data),
  });

  const { data: threads, isLoading } = useQuery<MessagesResponse>({
    queryKey: ['messages', roomId],
    queryFn: () =>
      notificationsApi
        .get<MessagesResponse>(`/api/messages/${roomId}`)
        .then((r) => r.data),
    enabled: room?.status === 'drawn',
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [threads, activeThread]);

  useEffect(() => {
    if (!socket) return;

    const handleMessage = (msg: ChatMessage & { thread: Thread }) => {
      if (msg.roomId !== roomId) return;
      qc.setQueryData<MessagesResponse>(['messages', roomId], (prev) => {
        if (!prev) return prev;
        if (msg.thread === 'giftee') {
          return {
            ...prev,
            giftee: prev.giftee
              ? { ...prev.giftee, messages: [...prev.giftee.messages, msg] }
              : prev.giftee,
          };
        }
        return {
          ...prev,
          santa: prev.santa
            ? { messages: [...prev.santa.messages, msg] }
            : prev.santa,
        };
      });
    };

    socket.on('message:received', handleMessage);
    return () => {
      socket.off('message:received', handleMessage);
    };
  }, [socket, roomId, qc]);

  const send = useMutation({
    mutationFn: (t: string) =>
      notificationsApi
        .post<ChatMessage>('/api/messages', { roomId, to: activeThread, text: t })
        .then((r) => r.data),
    onSuccess: (msg) => {
      qc.setQueryData<MessagesResponse>(['messages', roomId], (prev) => {
        if (!prev) return prev;
        if (activeThread === 'giftee') {
          return {
            ...prev,
            giftee: prev.giftee
              ? { ...prev.giftee, messages: [...prev.giftee.messages, msg] }
              : prev.giftee,
          };
        }
        return {
          ...prev,
          santa: prev.santa
            ? { messages: [...prev.santa.messages, msg] }
            : prev.santa,
        };
      });
      setText('');
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Failed to send message')),
  });

  function handleSend(e: FormEvent) {
    e.preventDefault();
    if (!text.trim() || send.isPending) return;
    send.mutate(text.trim());
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!text.trim() || send.isPending) return;
      send.mutate(text.trim());
    }
  }

  const gifteeName = threads?.giftee?.name ?? 'Your giftee';
  const messages =
    activeThread === 'giftee'
      ? (threads?.giftee?.messages ?? [])
      : (threads?.santa?.messages ?? []);

  const notDrawn = room?.status !== 'drawn';
  const placeholder =
    activeThread === 'giftee' ? `Message ${gifteeName}...` : 'Message your Secret Santa...';

  return (
    <>
      {/* header row */}
      <div className="mb-4 flex items-start justify-between gap-4">
        <PageHeader
          title={`Messages · ${room?.name ?? '…'}`}
          description="Two private chats: one with the giftee you drew, one with your own anonymous Secret Santa."
        />
        <Button
          variant="outline"
          size="sm"
          className="mt-1 shrink-0 gap-1.5"
          onClick={() => navigate(`/rooms/${roomId}`)}
        >
          <ArrowLeft className="size-4" /> Back to room
        </Button>
      </div>

      {notDrawn && room ? (
        <p className="text-sm text-muted-foreground">
          The draw hasn't happened yet — come back once names are drawn.
        </p>
      ) : (
        <>
          {/* tab switcher */}
          <div className="mb-3 flex gap-2 rounded-xl border border-border bg-card p-1">
            <button
              type="button"
              onClick={() => setActiveThread('giftee')}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-[13px] font-semibold transition-colors ${
                activeThread === 'giftee'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Gift className="size-4" />
              {gifteeName}
            </button>
            <button
              type="button"
              onClick={() => setActiveThread('santa')}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-[13px] font-semibold transition-colors ${
                activeThread === 'santa'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Sparkles className="size-4" />
              Your Secret Santa
            </button>
          </div>

          {/* chat card: bubble area + input in one bordered container */}
          <div className="flex flex-col rounded-xl border border-border bg-card overflow-hidden"
               style={{ height: 'calc(100vh - 300px)', minHeight: '360px' }}>
            {/* bubble area — scrollable */}
            <div className="flex-1 min-h-0 overflow-y-auto p-4">
              {isLoading ? (
                <p className="text-center text-sm text-muted-foreground">Loading…</p>
              ) : messages.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground">
                  No messages yet. Say hello!
                </p>
              ) : (
                messages.map((m) => <Bubble key={String(m.id)} msg={m} />)
              )}
              <div ref={bottomRef} />
            </div>

            {/* input bar — pinned to bottom of card */}
            <form
              onSubmit={handleSend}
              className="flex-none flex items-center gap-2 border-t border-border px-4 py-3"
            >
              <input
                className="flex-1 bg-transparent text-[15px] placeholder:text-muted-foreground focus:outline-none"
                placeholder={placeholder}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                maxLength={500}
                disabled={send.isPending}
              />
              <Button
                type="submit"
                size="sm"
                className="gap-1.5 shrink-0"
                disabled={!text.trim() || send.isPending}
              >
                <Send className="size-4" />
                Send
              </Button>
            </form>
          </div>
        </>
      )}
    </>
  );
}
