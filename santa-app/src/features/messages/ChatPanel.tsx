import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Bubble } from './Bubble';
import type { ChatMessage } from '@/types/api';

interface ChatPanelProps {
  thread: 'giftee' | 'santa';
  messages: ChatMessage[];
  onSend: (text: string) => void;
  sending: boolean;
}

export function ChatPanel({
  thread,
  messages,
  onSend,
  sending,
}: ChatPanelProps) {
  const [text, setText] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    onSend(text.trim());
    setText('');
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden rounded-lg border border-border">
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-8">
            {thread === 'giftee'
              ? 'No messages yet — send your giftee a hint!'
              : 'No messages yet — your Secret Santa may send you something soon.'}
          </p>
        ) : (
          messages.map((m) => <Bubble key={m.id} msg={m} />)
        )}
        <div ref={bottomRef} />
      </div>
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 border-t border-border p-3"
      >
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write a message…"
          maxLength={500}
          disabled={sending}
          className="flex-1"
        />
        <Button type="submit" size="sm" disabled={sending || !text.trim()}>
          <Send className="size-4" />
        </Button>
      </form>
    </div>
  );
}
