import { describe, expect, it } from 'vitest';
import type { ChatMessage, MessageThreads } from '@/types/api';
import { patchMessage } from './patch-message';

const msg = (over: Partial<ChatMessage> = {}): ChatMessage => ({
  id: 'm1',
  text: 'hi',
  createdAt: '2026-12-01T10:00:00.000Z',
  direction: 'out',
  myReaction: null,
  theirReaction: null,
  ...over,
});

const threads = (): MessageThreads => ({
  giftee: {
    id: 'u2',
    name: 'Bob',
    messages: [msg(), msg({ id: 'm2', direction: 'in' })],
  },
  santa: { messages: [msg({ id: 'm3', direction: 'in' })] },
});

describe('patchMessage', () => {
  it('patches only the matching message and keeps its other fields', () => {
    const next = patchMessage(threads(), 'giftee', 'm1', {
      theirReaction: '🎁',
    });

    expect(next?.giftee?.messages[0]).toMatchObject({
      id: 'm1',
      text: 'hi',
      theirReaction: '🎁',
    });
    // The sibling is untouched.
    expect(next?.giftee?.messages[1].theirReaction).toBeNull();
  });

  it('does not touch the other thread', () => {
    const prev = threads();
    const next = patchMessage(prev, 'giftee', 'm1', { myReaction: '👍' });

    // Referential equality: the santa thread object is reused, so React will
    // not re-render it.
    expect(next?.santa).toBe(prev.santa);
  });

  it('returns the SAME object when the id is not cached', () => {
    const prev = threads();

    // Identity, not just deep equality — a reaction for a message the user has
    // not loaded must cause no re-render at all.
    expect(patchMessage(prev, 'giftee', 'nope', { theirReaction: '🎁' })).toBe(
      prev,
    );
  });

  it('returns the SAME object when the target thread is null', () => {
    const prev: MessageThreads = { giftee: null, santa: null };

    expect(patchMessage(prev, 'giftee', 'm1', { myReaction: '🎁' })).toBe(prev);
  });

  it('is a no-op on an empty cache', () => {
    expect(patchMessage(undefined, 'giftee', 'm1', {})).toBeUndefined();
  });

  it('does not mutate the input', () => {
    const prev = threads();

    patchMessage(prev, 'giftee', 'm1', { myReaction: '❤️' });

    expect(prev.giftee?.messages[0].myReaction).toBeNull();
  });

  it('can clear a reaction by patching null', () => {
    const prev: MessageThreads = {
      giftee: { id: 'u2', name: 'Bob', messages: [msg({ myReaction: '🎁' })] },
      santa: null,
    };

    const next = patchMessage(prev, 'giftee', 'm1', { myReaction: null });

    expect(next?.giftee?.messages[0].myReaction).toBeNull();
  });
});
