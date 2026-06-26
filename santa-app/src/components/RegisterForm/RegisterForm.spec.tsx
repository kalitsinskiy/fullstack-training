import { describe, test, expect } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Routes, Route } from 'react-router';
import { renderApp } from '@/test/renderApp';
import { RegisterForm } from './RegisterForm';

describe('RegisterForm', () => {
  test('renders fields + button, no error', () => {
    renderApp(<RegisterForm />, { route: '/register' });

    expect(screen.getByLabelText('Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  test('empty input shows name, email, password errors and does not redirect on /login', async () => {
    const user = userEvent.setup();
    renderApp(
      <Routes>
        <Route path="/register" element={<RegisterForm />} />
        <Route path="/login" element={<div>Login screen</div>} />
      </Routes>,
      { route: '/register' }
    );

    await user.click(screen.getByRole('button', { name: /create account/i }));

    expect(await screen.findByText(/at least 2 characters/i)).toBeInTheDocument();
    expect(screen.getByText(/enter a valid email/i)).toBeInTheDocument();
    expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument();
    expect(screen.queryByText(/passwords do not match/i)).not.toBeInTheDocument();
    expect(screen.queryByText('Login screen')).not.toBeInTheDocument();
  });

  test('shows a mismatch error when passwords differ', async () => {
    const user = userEvent.setup();
    renderApp(<RegisterForm />, { route: '/register' });

    await user.type(screen.getByLabelText('Name'), 'Alice');
    await user.type(screen.getByLabelText('Email'), 'alice@example.com');
    await user.type(screen.getByLabelText('Password'), 'SecretPass1');
    await user.type(screen.getByLabelText('Confirm Password'), 'AnotherPass2');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    expect(await screen.findByText(/passwords do not match/i)).toBeInTheDocument();
  });

  test('succesfull registration redirects to /login', async () => {
    const user = userEvent.setup();
    renderApp(
      <Routes>
        <Route path="/register" element={<RegisterForm />} />
        <Route path="/login" element={<div>Login screen</div>} />
      </Routes>,
      { route: '/register' }
    );

    await user.type(screen.getByLabelText('Name'), 'Alice');
    await user.type(screen.getByLabelText('Email'), 'alice@example.com');
    await user.type(screen.getByLabelText('Password'), 'SecretPass1');
    await user.type(screen.getByLabelText('Confirm Password'), 'SecretPass1');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    expect(await screen.findByText('Login screen')).toBeInTheDocument();
  });

  test('shows a server error when the email is already registered (409)', async () => {
    const user = userEvent.setup();
    renderApp(<RegisterForm />, { route: '/register' });

    await user.type(screen.getByLabelText('Name'), 'Alice');
    await user.type(screen.getByLabelText('Email'), 'registered@example.com');
    await user.type(screen.getByLabelText('Password'), 'SecretPass1');
    await user.type(screen.getByLabelText('Confirm Password'), 'SecretPass1');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(/already registered/i);
  });
});
