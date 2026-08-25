import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { ArrowLeft, Gift, MessageCircle, Send, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import {
  MAX_MESSAGE_LENGTH,
  useMessageThreads,
  useSendMessage,
} from '@/features/messages/api';
import { useRoom } from '@/features/rooms/api';
import { getApiErrorMessage } from '@/lib/api';
import { cn } from '@/lib/utils';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/EmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { ChatMessage, MessageThread } from '@/types/api';

const SANTA_LABEL = 'Your Secret Santa';

export function RoomMessagesPage() {
  const { id = '' } = useParams<{ id: string }>();
  const roomQuery = useRoom(id);
  const threadsQuery = useMessageThreads(id);
  const sendMessage = useSendMessage(id);

  const [active, setActive] = useState<MessageThread>('giftee');
  const [draft, setDraft] = useState('');

  const threads = threadsQuery.data;
  const gifteeName = threads?.giftee?.name ?? 'Your giftee';
  const isDrawn = Boolean(threads?.giftee ?? threads?.santa);

  const messages = useMemo<ChatMessage[]>(
    () =>
      (active === 'giftee' ? threads?.giftee?.messages : threads?.santa?.messages) ??
      [],
    [active, threads],
  );

  function handleSend(event: FormEvent) {
    event.preventDefault();
    const text = draft.trim();
    if (!text || sendMessage.isPending) return;

    sendMessage.mutate(
      { to: active, text },
      {
        onSuccess: () => setDraft(''),
        onError: (error) =>
          toast.error(getApiErrorMessage(error, 'Could not send your message')),
      },
    );
  }

  return (
    <>
      <PageHeader
        title={`Messages${roomQuery.data ? ` · ${roomQuery.data.name}` : ''}`}
        description="Two private chats: one with the giftee you drew, one with your own anonymous Secret Santa."
        action={
          <Button variant="outline" asChild>
            <Link to={`/rooms/${id}`}>
              <ArrowLeft /> Back to room
            </Link>
          </Button>
        }
      />

      {threadsQuery.isLoading && (
        <p className="text-sm text-muted-foreground">Loading your chats…</p>
      )}

      {threadsQuery.isError && (
        <EmptyState
          icon={MessageCircle}
          title="Chats unavailable"
          description="We couldn't load your conversations for this room."
        />
      )}

      {threadsQuery.isSuccess && !isDrawn && (
        <EmptyState
          icon={MessageCircle}
          title="No chats yet"
          description="Once the draw is done you can message your giftee, and your Secret Santa can message you."
        />
      )}

      {threadsQuery.isSuccess && isDrawn && (
        <div className="space-y-4">
          <ThreadSwitcher
            active={active}
            gifteeName={gifteeName}
            onChange={setActive}
          />

          <div className="flex flex-col overflow-hidden rounded-lg border border-border bg-card/40">
            <MessageList
              messages={messages}
              emptyHint={
                active === 'giftee'
                  ? `No messages yet. Say hello to ${gifteeName} — they know it's you.`
                  : 'No messages yet. Your Secret Santa stays anonymous, so reply freely.'
              }
            />

            <form
              onSubmit={handleSend}
              className="flex items-center gap-2 border-t border-border p-4"
            >
              <Input
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder={`Message ${active === 'giftee' ? gifteeName : SANTA_LABEL}…`}
                maxLength={MAX_MESSAGE_LENGTH}
                aria-label={`Message ${active === 'giftee' ? gifteeName : SANTA_LABEL}`}
                disabled={sendMessage.isPending}
              />
              <Button type="submit" disabled={!draft.trim() || sendMessage.isPending}>
                <Send /> {sendMessage.isPending ? 'Sending…' : 'Send'}
              </Button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

function ThreadSwitcher({
  active,
  gifteeName,
  onChange,
}: {
  active: MessageThread;
  gifteeName: string;
  onChange: (thread: MessageThread) => void;
}) {
  const tabs: { thread: MessageThread; label: string; icon: typeof Gift }[] = [
    { thread: 'giftee', label: gifteeName, icon: Gift },
    { thread: 'santa', label: SANTA_LABEL, icon: Sparkles },
  ];

  return (
    <div
      role="tablist"
      aria-label="Chats"
      className="grid grid-cols-2 gap-1 rounded-lg border border-border bg-card/40 p-1"
    >
      {tabs.map(({ thread, label, icon: Icon }) => (
        <button
          key={thread}
          type="button"
          role="tab"
          aria-selected={active === thread}
          onClick={() => onChange(thread)}
          className={cn(
            'inline-flex h-10 items-center justify-center gap-2 rounded-md px-4 text-[15px] font-semibold transition-colors',
            active === thread
              ? 'bg-primary text-primary-foreground shadow'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground',
          )}
        >
          <Icon className="size-4 shrink-0" />
          <span className="truncate">{label}</span>
        </button>
      ))}
    </div>
  );
}

function MessageList({
  messages,
  emptyHint,
}: {
  messages: ChatMessage[];
  emptyHint: string;
}) {
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const list = listRef.current;
    if (list) {
      list.scrollTop = list.scrollHeight;
    }
  }, [messages]);

  return (
    <div
      ref={listRef}
      className="flex min-h-[22rem] flex-col gap-2 overflow-y-auto p-4 md:min-h-[28rem] md:max-h-[28rem]"
    >
      {messages.length === 0 ? (
        <p className="m-auto max-w-xs text-center text-sm text-muted-foreground">
          {emptyHint}
        </p>
      ) : (
        messages.map((message) => <Bubble key={message.id} message={message} />)
      )}
    </div>
  );
}

function Bubble({ message }: { message: ChatMessage }) {
  const isOwn = message.direction === 'out';

  return (
    <div className={cn('flex', isOwn ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[80%] rounded-lg px-4 py-2.5 text-[15px] shadow-sm',
          isOwn
            ? 'rounded-br-sm bg-primary text-primary-foreground'
            : 'rounded-bl-sm bg-muted text-foreground',
        )}
      >
        <p className="whitespace-pre-wrap break-words">{message.text}</p>
        <p
          className={cn(
            'mt-1 text-right text-xs font-medium',
            isOwn ? 'text-primary-foreground/75' : 'text-muted-foreground',
          )}
        >
          {format(new Date(message.createdAt), 'hh:mm a')}
        </p>
      </div>
    </div>
  );
}
