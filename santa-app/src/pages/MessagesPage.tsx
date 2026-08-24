import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { notificationsApi, getApiErrorMessage } from '@/lib/api';
import { useSocket } from '@/hooks/useSocket';
import { useUnreadMessages } from '@/features/messages/useUnreadMessages';
import { ChatPanel } from '@/features/messages/ChatPanel';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/EmptyState';
import type { ChatMessage, MessagesResponse } from '@/types/api';

/** Append a message to its thread, returning a new response (or prev unchanged). */
function appendMessageToThread(
  prev: MessagesResponse | undefined,
  thread: 'giftee' | 'santa',
  message: ChatMessage,
): MessagesResponse | undefined {
  if (!prev) return prev;
  if (thread === 'giftee' && prev.giftee) {
    return {
      ...prev,
      giftee: { ...prev.giftee, messages: [...prev.giftee.messages, message] },
    };
  }
  if (thread === 'santa' && prev.santa) {
    return {
      ...prev,
      santa: { ...prev.santa, messages: [...prev.santa.messages, message] },
    };
  }
  return prev;
}

export function MessagesPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const { socket } = useSocket();
  const queryClient = useQueryClient();
  const { clear } = useUnreadMessages();
  const [activeThread, setActiveThread] = useState<'giftee' | 'santa'>(
    'giftee',
  );
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (roomId) clear(roomId);
  }, [roomId, clear]);

  const { data, isLoading, isError, error } = useQuery<MessagesResponse>({
    queryKey: ['messages', roomId],
    queryFn: async () => {
      const { data } = await notificationsApi.get<MessagesResponse>(
        `/api/messages/${roomId}`,
      );
      return data;
    },
    enabled: !!roomId,
  });

  useEffect(() => {
    if (!socket || !roomId) return;

    const handleMessage = (
      msg: ChatMessage & { thread: 'giftee' | 'santa' },
    ) => {
      if (msg.roomId !== roomId) return;
      queryClient.setQueryData<MessagesResponse>(['messages', roomId], (prev) =>
        appendMessageToThread(prev, msg.thread, msg),
      );
    };

    socket.on('message:received', handleMessage);
    return () => {
      socket.off('message:received', handleMessage);
    };
  }, [socket, roomId, queryClient]);

  async function handleSend(text: string) {
    if (!roomId) return;
    setSending(true);
    try {
      const { data: sent } = await notificationsApi.post<ChatMessage>(
        '/api/messages',
        {
          roomId,
          to: activeThread,
          text,
        },
      );
      queryClient.setQueryData<MessagesResponse>(['messages', roomId], (prev) =>
        appendMessageToThread(prev, activeThread, sent),
      );
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to send message'));
    } finally {
      setSending(false);
    }
  }

  if (isLoading) {
    return (
      <>
        <PageHeader
          title="Messages"
          description="Anonymous chat with your match."
        />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      </>
    );
  }

  if (isError) {
    return (
      <>
        <PageHeader title="Messages" />
        <p className="text-sm text-destructive">
          {getApiErrorMessage(error, 'Failed to load messages')}
        </p>
      </>
    );
  }

  if (!data?.giftee && !data?.santa) {
    return (
      <>
        <PageHeader
          title="Messages"
          description="Anonymous chat with your match."
        />
        <EmptyState
          icon={MessageCircle}
          title="No messages yet"
          description="Once the draw is done, you can send anonymous wishes to your giftee."
        />
      </>
    );
  }

  const gifteeName = data.giftee?.name ?? 'Your Giftee';
  const tabs: { key: 'giftee' | 'santa'; label: string }[] = [
    ...(data.giftee ? [{ key: 'giftee' as const, label: gifteeName }] : []),
    ...(data.santa
      ? [{ key: 'santa' as const, label: 'Your Secret Santa' }]
      : []),
  ];

  const activeMessages =
    activeThread === 'giftee'
      ? (data.giftee?.messages ?? [])
      : (data.santa?.messages ?? []);

  return (
    <>
      <PageHeader
        title="Messages"
        description="Anonymous chat with your match."
      />

      <div
        className="flex flex-col gap-4"
        style={{ height: 'calc(100vh - 12rem)' }}
      >
        {/* Thread switcher */}
        <div className="flex gap-2 rounded-lg border border-border bg-muted p-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveThread(tab.key)}
              className={cn(
                'flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors',
                activeThread === tab.key
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <ChatPanel
          thread={activeThread}
          messages={activeMessages}
          onSend={handleSend}
          sending={sending}
        />
      </div>
    </>
  );
}
