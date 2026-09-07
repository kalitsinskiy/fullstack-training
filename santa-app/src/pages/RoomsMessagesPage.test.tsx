import { describe, it, expect } from 'vitest';
import { delay, http, HttpResponse } from 'msw';
import { Route, Routes } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, screen, waitFor } from '@/test/render';
import { server } from '@/test/mocks/server';
import { tokenStore } from '@/lib/api';
import { RoomMessagesPage } from './RoomMessagesPage';

const soloMessage = {
  id: 'm1',
  text: 'hope you like puzzles!',
  createdAt: new Date().toISOString(),
  direction: 'out' as const,
  read: false,
  myReaction: null,
  theirReaction: null,
};

function setup() {
  tokenStore.set('test-token');

  return renderWithProviders(
    <Routes>
      <Route path="/rooms/:id/messages" element={<RoomMessagesPage />} />
    </Routes>,
    { route: '/rooms/r1/messages' },
  );
}

describe('RoomMessagesPage', () => {
  it('shows the giftee chat by name and places bubbles by direction', async () => {
    setup();

    expect(
      await screen.findByRole('button', { name: 'Bob' }),
    ).toBeInTheDocument();
    expect(screen.getByText('hope you like puzzles!')).toBeInTheDocument();
    expect(screen.getByText('I do!')).toBeInTheDocument();

    expect(
      screen.getByRole('button', { name: /your secret santa/i }),
    ).toBeInTheDocument();
  });

  it('switches to the anonymous santa thread', async () => {
    setup();

    await userEvent.click(
      await screen.findByRole('button', { name: /your secret santa/i }),
    );

    expect(await screen.findByText('guess who')).toBeInTheDocument();
    expect(
      screen.queryByText('hope you like puzzles!'),
    ).not.toBeInTheDocument();
  });

  it('sends with { roomId, to, text } — never a recipient id — and clears the composer', async () => {
    let sent: Record<string, unknown> | undefined;

    server.use(
      http.post('/api/messages', async ({ request }) => {
        sent = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json(
          {
            id: 'm9',
            text: String(sent.text),
            createdAt: new Date().toISOString(),
            direction: 'out',
            thread: sent.to,
          },
          { status: 201 },
        );
      }),
    );

    setup();

    const input = await screen.findByLabelText('Message');
    await userEvent.type(input, 'a hint');
    await userEvent.click(
      screen.getByRole('button', { name: /send message/i }),
    );

    await waitFor(() =>
      expect(sent).toEqual({ roomId: 'r1', to: 'giftee', text: 'a hint' }),
    );

    expect(sent).not.toHaveProperty('recipientId');

    await waitFor(() => expect(input).toHaveValue(''));
  });

  it('shows the locked state when neither thread exists (not drawn)', async () => {
    server.use(
      http.get('/api/messages/:roomId', () =>
        HttpResponse.json({ giftee: null, santa: null }),
      ),
    );

    setup();

    expect(await screen.findByText(/isn't available yet/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /back to room/i })).toHaveAttribute(
      'href',
      '/rooms/r1',
    );
  });

  it('shows the room name as the page title', async () => {
    setup();

    // The heading is "Messages | <room name>" — assert the name is present
    // without pinning the exact title format.
    expect(
      await screen.findByRole('heading', { name: /Office Party/ }),
    ).toBeInTheDocument();
  });

  it('shows the picked reaction before the request resolves (optimistic)', async () => {
    server.use(
      http.get('/api/messages/:roomId', () =>
        HttpResponse.json({
          giftee: { id: 'u2', name: 'Bob', messages: [soloMessage] },
          santa: null,
        }),
      ),
      http.put('/api/messages/:id/reaction', async () => {
        await delay('infinite');

        return HttpResponse.json({});
      }),
    );

    setup();

    await screen.findByText('hope you like puzzles!');
    await userEvent.click(screen.getByLabelText('🎁'));

    expect(await screen.findByLabelText('You reacted 🎁')).toBeInTheDocument();
  });

  it('rolls the reaction back when the request fails', async () => {
    server.use(
      http.get('/api/messages/:roomId', () =>
        HttpResponse.json({
          giftee: { id: 'u2', name: 'Bob', messages: [soloMessage] },
          santa: null,
        }),
      ),
      http.put(
        '/api/messages/:id/reaction',
        () => new HttpResponse(null, { status: 500 }),
      ),
    );

    setup();

    await screen.findByText('hope you like puzzles!');
    await userEvent.click(screen.getByLabelText('🎁'));

    await waitFor(() =>
      expect(screen.queryByLabelText('You reacted 🎁')).not.toBeInTheDocument(),
    );
  });

  it('renders a reaction from the counterparty without naming them', async () => {
    server.use(
      http.get('/api/messages/:roomId', () =>
        HttpResponse.json({
          giftee: null,
          santa: {
            messages: [
              { ...soloMessage, direction: 'in', theirReaction: '😂' },
            ],
          },
        }),
      ),
    );

    setup();

    await userEvent.click(
      await screen.findByRole('button', { name: /your secret santa/i }),
    );

    expect(await screen.findByLabelText('They reacted 😂')).toBeInTheDocument();
    expect(screen.queryByLabelText(/You reacted/)).not.toBeInTheDocument();
  });

  it('marks the active thread read on open', async () => {
    let patched: { url: string; body: unknown } | undefined;

    server.use(
      http.patch('/api/messages/:roomId/read', async ({ request, params }) => {
        patched = { url: String(params.roomId), body: await request.json() };
        return HttpResponse.json({ updated: 2 });
      }),
    );

    setup();

    await screen.findByText('hope you like puzzles!');
    await waitFor(() =>
      expect(patched).toEqual({ url: 'r1', body: { thread: 'giftee' } }),
    );
  });
});
