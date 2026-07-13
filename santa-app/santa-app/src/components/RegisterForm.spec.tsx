import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, test, expect, vi } from 'vitest';
import { renderApp } from '@/test/renderApp';
import { tokenFor } from '@/test/msw-server';
import { RegisterForm } from './RegisterForm';

async function fillForm(
  user: ReturnType<typeof userEvent.setup>,
  { displayName = 'New User', email = 'newuser@test.com', password = 'password1', confirm = 'password1' } = {},
) {
  await user.type(screen.getByLabelText(/full name/i), displayName);
  await user.type(screen.getByLabelText(/email address/i), email);
  await user.type(screen.getByLabelText(/^password$/i), password);
  await user.type(screen.getByLabelText(/confirm password/i), confirm);
}

describe('RegisterForm', () => {
  test('shows a Zod refine error when passwords do not match', async () => {
    const user = userEvent.setup();
    renderApp(<RegisterForm />);

    await fillForm(user, { confirm: 'somethingElse1' });
    await user.click(screen.getByRole('button', { name: /create account/i }));

    expect(await screen.findByText(/passwords do not match/i)).toBeInTheDocument();
  });

  test('registers and calls onSuccess on the success path', async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    renderApp(<RegisterForm onSuccess={onSuccess} />);

    await fillForm(user, { email: 'newuser@test.com' });
    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => expect(onSuccess).toHaveBeenCalledOnce());
    expect(localStorage.getItem('token')).toBe(tokenFor('newuser@test.com'));
  });

  test('shows the server error on a 409 response', async () => {
    const user = userEvent.setup();
    renderApp(<RegisterForm />);

    await fillForm(user, { email: 'taken@test.com' });
    await user.click(screen.getByRole('button', { name: /create account/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/email already registered/i);
    expect(localStorage.getItem('token')).toBeNull();
  });
});
