import { describe, it, expect, vi } from 'vitest';
import { Route, Routes } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { toast } from 'sonner';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, screen } from '@/test/render';
import { server } from '@/test/mocks/server';
import { RegisterPage } from './RegisterPage';

function setup() {
  return renderWithProviders(
    <Routes>
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/rooms" element={<div>Rooms dashboard</div>} />
    </Routes>,
    { route: '/register' },
  );
}

async function fillValid() {
  await userEvent.type(screen.getByLabelText(/display name/i), 'Alice');
  await userEvent.type(screen.getByLabelText(/email/i), 'alice@example.com');
  await userEvent.type(screen.getByLabelText(/^password$/i), 'SecretPass1');
  await userEvent.type(
    screen.getByLabelText(/confirm password/i),
    'SecretPass1',
  );
}

describe('RegisterPage', () => {
  it('blocks submit and shows field errors on invalid input', async () => {
    setup();

    await userEvent.click(
      screen.getByRole('button', { name: /create account/i }),
    );

    expect(
      await screen.findByText(/at least 2 characters/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/enter a valid email/i)).toBeInTheDocument();
    expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument();
    expect(screen.queryByText('Rooms dashboard')).not.toBeInTheDocument();
  });

  it('shows a mismatch error when confirmation password is different', async () => {
    setup();

    await userEvent.type(screen.getByLabelText(/display name/i), 'Alice');
    await userEvent.type(screen.getByLabelText(/email/i), 'alice@example.com');
    await userEvent.type(screen.getByLabelText(/^password$/i), 'SecretPass1');
    await userEvent.type(
      screen.getByLabelText(/confirm password/i),
      'SecretPass2',
    );
    await userEvent.click(
      screen.getByRole('button', { name: /create account/i }),
    );

    expect(
      await screen.findByText(/passwords do not match/i),
    ).toBeInTheDocument();
  });

  it('registers, auto-logs-in, and lands on /rooms', async () => {
    setup();

    await fillValid();
    await userEvent.click(
      screen.getByRole('button', { name: /create account/i }),
    );

    expect(await screen.findByText('Rooms dashboard')).toBeInTheDocument();
  });

  it('surfaces a 409 duplicate-email error via toast', async () => {
    const errorSpy = vi.spyOn(toast, 'error');

    server.use(
      http.post('/api/auth/register', () =>
        HttpResponse.json(
          {
            success: false,
            statusCode: 409,
            message: 'Email is already registered',
          },
          { status: 409 },
        ),
      ),
    );

    setup();

    await fillValid();
    await userEvent.click(
      screen.getByRole('button', { name: /create account/i }),
    );

    await vi.waitFor(() =>
      expect(errorSpy).toHaveBeenCalledWith('Email is already registered'),
    );
  });
});
