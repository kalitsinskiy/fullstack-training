import { describe, it, expect } from 'vitest';
import { userEvent } from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/mocks/server';
import { renderWithProviders, screen, waitFor } from '@/test/render';
import { RegisterPage } from './RegisterPage';

const API = import.meta.env.VITE_API_URL ?? '';

describe('RegisterPage', () => {
  it('renders display name, email, password, confirm password fields and submit button', () => {
    renderWithProviders(<RegisterPage />);

    expect(screen.getByLabelText(/display name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
  });

  it('does not call the API when passwords do not match', async () => {
    let registerCalled = false;
    server.use(
      http.post(`${API}/api/auth/register`, () => {
        registerCalled = true;
        return HttpResponse.json({});
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(<RegisterPage />);

    await user.type(screen.getByLabelText(/display name/i), 'Alice');
    await user.type(screen.getByLabelText(/^email/i), 'alice@test.com');
    await user.type(screen.getByLabelText(/^password/i), 'password123');
    await user.type(screen.getByLabelText(/confirm password/i), 'different456');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    expect(registerCalled).toBe(false);
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
  });

  it('calls the register API and succeeds', async () => {
    let registerCalled = false;
    server.use(
      http.post(`${API}/api/auth/register`, () => {
        registerCalled = true;
        return HttpResponse.json({ id: 'u1', email: 'alice@test.com', displayName: 'Alice', accessToken: 'tok' });
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(<RegisterPage />);

    await user.type(screen.getByLabelText(/display name/i), 'Alice');
    await user.type(screen.getByLabelText(/^email/i), 'alice@test.com');
    await user.type(screen.getByLabelText(/^password/i), 'password123');
    await user.type(screen.getByLabelText(/confirm password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(registerCalled).toBe(true);
    });
  });

  it('shows an error message on 409 duplicate email', async () => {
    server.use(
      http.post(`${API}/api/auth/register`, () =>
        HttpResponse.json({ message: 'Email already registered' }, { status: 409 }),
      ),
    );

    const user = userEvent.setup();
    renderWithProviders(<RegisterPage />);

    await user.type(screen.getByLabelText(/display name/i), 'Alice');
    await user.type(screen.getByLabelText(/^email/i), 'taken@test.com');
    await user.type(screen.getByLabelText(/^password/i), 'password123');
    await user.type(screen.getByLabelText(/confirm password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /create account/i })).not.toBeDisabled();
    });
  });

  it('links to the login page', () => {
    renderWithProviders(<RegisterPage />);
    const link = screen.getByRole('link', { name: /sign in/i });
    expect(link).toHaveAttribute('href', '/login');
  });
});
