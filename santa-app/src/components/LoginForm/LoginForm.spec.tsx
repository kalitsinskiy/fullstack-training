import { describe, test, expect } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Routes, Route } from 'react-router';
import { renderApp } from '@/test/renderApp';
import { LoginForm } from './LoginForm';

describe('LoginForm', () => {
  test('renders fields + button, no error', () => {
    renderApp(<LoginForm />, { route: '/login' });

    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  test('shows Zod validation errors on empty submit and does not proceed redirections', async () => {
    const user = userEvent.setup();

    renderApp(
      <Routes>
        <Route path="/login" element={<LoginForm />} />
        <Route path="/rooms" element={<div>Rooms screen</div>} />
      </Routes>,
      { route: '/login' }
    );

    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByText(/enter a valid email/i)).toBeInTheDocument();
    expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument();
    expect(screen.queryByText('Rooms screen')).not.toBeInTheDocument();
  });

  test('shows only the email error when email is invalid (and password is valid)', async () => {
    const user = userEvent.setup();
    renderApp(<LoginForm />, { route: '/login' });

    await user.type(screen.getByLabelText('Email'), 'not-an-email');
    await user.type(screen.getByLabelText('Password'), 'ValidPassword');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByText(/enter a valid email/i)).toBeInTheDocument();
    expect(screen.queryByText(/at least 8 characters/i)).not.toBeInTheDocument();
  });

  test('valid credentials log in and navigate to /rooms', async () => {
    const user = userEvent.setup();
    renderApp(
      <Routes>
        <Route path="/login" element={<LoginForm />} />
        <Route path="/rooms" element={<div>Rooms screen</div>} />
      </Routes>,
      { route: '/login' }
    );

    await user.type(screen.getByLabelText('Email'), 'testuser@example.com');
    await user.type(screen.getByLabelText('Password'), 'SecretPass1');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByText('Rooms screen')).toBeDefined();
  });

  test('shows server error when the API reject the login (401)', async () => {
    const user = userEvent.setup();
    renderApp(<LoginForm />, { route: '/login' });

    await user.type(screen.getByLabelText('Email'), 'wrong@example.com');
    await user.type(screen.getByLabelText('Password'), 'SecretPass1');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/invalid credentials/i);
  });
});
