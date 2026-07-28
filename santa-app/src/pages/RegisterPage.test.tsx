import { afterEach, describe, it, expect, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { toast } from 'sonner';
import { renderWithProviders, screen, waitFor } from '@/test/render';
import { server } from '@/test/mocks/server';
import { RegisterPage } from './RegisterPage';

// Registering logs the user in, which makes SocketProvider open a socket.io
// connection. Stub the client so tests never touch a real transport.
vi.mock('socket.io-client', () => ({
  io: () => ({
    on: vi.fn(),
    emit: vi.fn(),
    disconnect: vi.fn(),
    removeAllListeners: vi.fn(),
  }),
}));

const NEW_USER = {
  id: '665f0c2ab7d13a5e8b1c4d02',
  email: 'bob@test.com',
  displayName: 'Bob',
};

/** Render the register screen with a /rooms route to land on, so we see the redirect. */
function renderRegister() {
  return renderWithProviders(
    <Routes>
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/rooms" element={<h1>Your rooms</h1>} />
    </Routes>,
    { route: '/register' },
  );
}

async function fillAndSubmit() {
  await userEvent.type(screen.getByLabelText(/display name/i), 'Bob');
  await userEvent.type(screen.getByLabelText(/email/i), 'bob@test.com');
  await userEvent.type(screen.getByLabelText(/password/i), 'secret123');
  await userEvent.click(screen.getByRole('button', { name: /create account/i }));
}

describe('RegisterPage', () => {
  afterEach(() => {
    // `login()` persists the token — clear it so the next test starts anonymous.
    localStorage.clear();
  });

  // Renders with no network call (no token → AuthProvider idle).
  it('renders the display name, email and password fields and a submit button', () => {
    renderWithProviders(<RegisterPage />);

    expect(screen.getByLabelText(/display name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /create account/i }),
    ).toBeInTheDocument();
  });

  it('submits the form, logs in and lands on /rooms', async () => {
    const posted = vi.fn();
    server.use(
      http.post('/api/auth/register', async ({ request }) => {
        posted(await request.json());
        return HttpResponse.json(
          { ...NEW_USER, accessToken: 'new-token' },
          { status: 201 },
        );
      }),
      http.get('/api/users/me', () => HttpResponse.json(NEW_USER)),
    );

    renderRegister();
    await fillAndSubmit();

    await waitFor(() => {
      expect(posted).toHaveBeenCalledWith({
        email: 'bob@test.com',
        password: 'secret123',
        displayName: 'Bob',
      });
    });

    expect(
      await screen.findByRole('heading', { name: 'Your rooms' }),
    ).toBeInTheDocument();
    expect(localStorage.getItem('santa.accessToken')).toBe('new-token');
  });

  it('shows an error toast when the email is already registered', async () => {
    const errorToast = vi.spyOn(toast, 'error');
    server.use(
      http.post('/api/auth/register', () =>
        HttpResponse.json(
          { message: 'Email is already registered' },
          { status: 409 },
        ),
      ),
    );

    renderRegister();
    await fillAndSubmit();

    await waitFor(() => {
      expect(errorToast).toHaveBeenCalledWith('Email is already registered');
    });

    // Still on the form, no session created.
    expect(
      screen.getByRole('button', { name: /create account/i }),
    ).toBeInTheDocument();
    expect(localStorage.getItem('santa.accessToken')).toBeNull();

    errorToast.mockRestore();
  });

  it('links to the login page', () => {
    renderWithProviders(<RegisterPage />);

    expect(screen.getByRole('link', { name: /sign in/i })).toHaveAttribute(
      'href',
      '/login',
    );
  });
});
