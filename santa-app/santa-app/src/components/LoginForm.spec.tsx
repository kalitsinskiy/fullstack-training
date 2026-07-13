import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, test, expect, vi } from 'vitest';
import { renderApp } from '@/test/renderApp';
import { ALICE, tokenFor } from '@/test/msw-server';
import { LoginForm } from './LoginForm';

describe('LoginForm', () => {
  test('renders email and password fields', () => {
    renderApp(<LoginForm />);

    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  test('shows Zod validation errors when submitting empty', async () => {
    const user = userEvent.setup();
    renderApp(<LoginForm />);

    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByText(/enter a valid email/i)).toBeInTheDocument();
    expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument();
  });

  test('logs in and calls onSuccess with valid credentials', async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    renderApp(<LoginForm onSuccess={onSuccess} />);

    await user.type(screen.getByLabelText(/email address/i), ALICE.email);
    await user.type(screen.getByLabelText(/^password$/i), ALICE.password);
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => expect(onSuccess).toHaveBeenCalledOnce());
    expect(localStorage.getItem('token')).toBe(tokenFor(ALICE.email));
  });

  test('shows the server error on a 401 response', async () => {
    const user = userEvent.setup();
    renderApp(<LoginForm />);

    await user.type(screen.getByLabelText(/email address/i), 'wrong@test.com');
    await user.type(screen.getByLabelText(/^password$/i), ALICE.password);
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/invalid credentials/i);
    expect(localStorage.getItem('token')).toBeNull();
  });
});
