import { describe, it, expect } from 'vitest';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/mocks/server';
import { renderWithProviders, screen, waitFor } from '@/test/render';
import { LoginPage } from './LoginPage';

describe('LoginPage', () => {
  it('renders the email and password fields and a submit button', () => {
    renderWithProviders(<LoginPage />);

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /sign in/i }),
    ).toBeInTheDocument();
  });

  it('submits credentials, stores token, and navigates away on success', async () => {
    server.use(
      http.post('/api/auth/login', () =>
        HttpResponse.json({ accessToken: 'test-token' }),
      ),
      http.get('/api/users/me', () =>
        HttpResponse.json({
          id: 'user-1',
          email: 'alice@test.com',
          displayName: 'Alice',
          role: 'user',
        }),
      ),
      http.get('/api/rooms', () =>
        HttpResponse.json({
          data: [],
          meta: { total: 0, page: 1, limit: 10, totalPages: 1 },
        }),
      ),
    );

    const user = userEvent.setup();
    renderWithProviders(<LoginPage />);

    await user.type(screen.getByLabelText(/email/i), 'alice@test.com');
    await user.type(screen.getByLabelText(/password/i), 'SecretPass1');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(localStorage.getItem('santa.accessToken')).toBe('test-token');
    });
  });

  it('shows an error toast on invalid credentials (401)', async () => {
    server.use(
      http.post('/api/auth/login', () =>
        HttpResponse.json(
          { message: 'Invalid email or password' },
          { status: 401 },
        ),
      ),
    );

    const user = userEvent.setup();
    renderWithProviders(<LoginPage />);

    await user.type(screen.getByLabelText(/email/i), 'wrong@test.com');
    await user.type(screen.getByLabelText(/password/i), 'wrongpass');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(
      await screen.findByText(/invalid email or password/i),
    ).toBeInTheDocument();
  });

  it('links to the register page', () => {
    renderWithProviders(<LoginPage />);
    expect(screen.getByRole('link', { name: /create one/i })).toHaveAttribute(
      'href',
      '/register',
    );
  });
});
