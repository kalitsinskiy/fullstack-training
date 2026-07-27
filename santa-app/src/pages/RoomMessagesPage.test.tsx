import { describe, expect, it, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { renderWithProviders, screen, waitFor } from '@/test/render';
import { server } from '@/test/mocks/server';
import { RoomMessagesPage } from './RoomMessagesPage';
import type { ChatMessage, MessageThreads } from '@/types/api';

const ROOM_ID = '665f0c2ab7d13a5e8b1c4d9f';

function message(overrides: Partial<ChatMessage> = {}): ChatMessage {
  return {
    id: 'm1',
    roomId: ROOM_ID,
    text: 'Hi! Got your name 🎁 any hints on what you would love?',
    createdAt: '2026-12-20T09:52:00.000Z',
    direction: 'out',
    ...overrides,
  };
}

function serveThreads(threads: MessageThreads) {
  server.use(
    http.get(`/api/rooms/${ROOM_ID}`, () =>
      HttpResponse.json({
        id: ROOM_ID,
        name: 'Office Secret Santa',
        inviteCode: 'Q7X4LM',
        creatorId: 'u1',
        status: 'drawn',
        participants: [],
        participantCount: 3,
      }),
    ),
    http.get(`/api/messages/${ROOM_ID}`, () => HttpResponse.json(threads)),
  );
}

function renderPage() {
  return renderWithProviders(
    <Routes>
      <Route path="/rooms/:id/messages" element={<RoomMessagesPage />} />
    </Routes>,
    { route: `/rooms/${ROOM_ID}/messages` },
  );
}

describe('RoomMessagesPage', () => {
  it('names the giftee chat and keeps the santa chat anonymous', async () => {
    serveThreads({
      giftee: { id: 'u2', name: 'Carol', messages: [message()] },
      santa: { messages: [] },
    });
    renderPage();

    expect(
      await screen.findByRole('tab', { name: /Carol/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('tab', { name: /Your Secret Santa/ }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Messages · Office Secret Santa/)).toBeInTheDocument();
  });

  it('shows the giftee chat first and switches to the santa chat', async () => {
    serveThreads({
      giftee: { id: 'u2', name: 'Carol', messages: [message({ text: 'for Carol' })] },
      santa: {
        messages: [message({ id: 'm2', text: 'from your santa', direction: 'in' })],
      },
    });
    renderPage();

    expect(await screen.findByText('for Carol')).toBeInTheDocument();
    expect(screen.queryByText('from your santa')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('tab', { name: /Your Secret Santa/ }));

    expect(await screen.findByText('from your santa')).toBeInTheDocument();
    expect(screen.queryByText('for Carol')).not.toBeInTheDocument();
  });

  it('sends { roomId, to, text } for the active chat — never a recipient id', async () => {
    serveThreads({
      giftee: { id: 'u2', name: 'Carol', messages: [] },
      santa: { messages: [] },
    });

    const posted = vi.fn();
    server.use(
      http.post('/api/messages', async ({ request }) => {
        const body = await request.json();
        posted(body);
        return HttpResponse.json(message({ text: 'thanks, santa!' }), {
          status: 201,
        });
      }),
    );

    renderPage();

    await userEvent.click(
      await screen.findByRole('tab', { name: /Your Secret Santa/ }),
    );
    await userEvent.type(
      screen.getByLabelText('Message Your Secret Santa'),
      'thanks, santa!',
    );
    await userEvent.click(screen.getByRole('button', { name: /Send/ }));

    await waitFor(() => {
      expect(posted).toHaveBeenCalledWith({
        roomId: ROOM_ID,
        to: 'santa',
        text: 'thanks, santa!',
      });
    });
  });

  it('tells the user when the room has not been drawn', async () => {
    serveThreads({ giftee: null, santa: null });
    renderPage();

    expect(await screen.findByText('No chats yet')).toBeInTheDocument();
    expect(screen.queryByRole('tab')).not.toBeInTheDocument();
  });

  it('surfaces a load failure', async () => {
    serveThreads({ giftee: null, santa: null });
    server.use(
      http.get(`/api/messages/${ROOM_ID}`, () => new HttpResponse(null, { status: 500 })),
    );
    renderPage();

    expect(await screen.findByText('Chats unavailable')).toBeInTheDocument();
  });
});
