import { describe, it, expect, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, screen, waitFor } from '@/test/render';
import { server } from '@/test/mocks/server';
import { http, HttpResponse } from 'msw';
import { ProfilePage } from './ProfilePage';

describe('ProfilePage', () => {
  beforeEach(() => {
    // Set the token so AuthProvider fetches /api/users/me on mount
    localStorage.setItem('santa.accessToken', 'test-token');
  });

  it('renders user display name and email', async () => {
    renderWithProviders(<ProfilePage />);

    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
  });

  it('shows a delete account button that opens a confirmation dialog', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ProfilePage />);

    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: /delete account/i }),
      ).toBeInTheDocument(),
    );

    await user.click(screen.getByRole('button', { name: /delete account/i }));

    expect(
      screen.getByRole('heading', { name: /delete your account/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/this action cannot be undone/i),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('closes the dialog when Cancel is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ProfilePage />);

    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: /delete account/i }),
      ).toBeInTheDocument(),
    );
    await user.click(screen.getByRole('button', { name: /delete account/i }));
    expect(
      screen.getByRole('heading', { name: /delete your account/i }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /cancel/i }));
    expect(
      screen.queryByRole('heading', { name: /delete your account/i }),
    ).not.toBeInTheDocument();
  });

  it('calls DELETE /api/users/me and logs out on confirmation', async () => {
    let deleteCalled = false;
    server.use(
      http.delete('/api/users/me', () => {
        deleteCalled = true;
        return new HttpResponse(null, { status: 204 });
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(<ProfilePage />);

    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: /delete account/i }),
      ).toBeInTheDocument(),
    );
    await user.click(screen.getByRole('button', { name: /delete account/i }));
    await user.click(screen.getByRole('button', { name: /^delete account$/i }));

    await waitFor(() => expect(deleteCalled).toBe(true));
  });

  it('shows an error toast when account deletion fails', async () => {
    server.use(
      http.delete('/api/users/me', () =>
        HttpResponse.json(
          {
            success: false,
            error: {
              code: 'INTERNAL_ERROR',
              message: 'Failed to delete account',
            },
          },
          { status: 500 },
        ),
      ),
    );

    const user = userEvent.setup();
    renderWithProviders(<ProfilePage />);

    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: /delete account/i }),
      ).toBeInTheDocument(),
    );
    await user.click(screen.getByRole('button', { name: /delete account/i }));
    await user.click(screen.getByRole('button', { name: /^delete account$/i }));

    await waitFor(() =>
      expect(screen.getByText(/failed to delete account/i)).toBeInTheDocument(),
    );
  });

  it('can edit display name', async () => {
    server.use(
      http.patch('/api/users/me', () =>
        HttpResponse.json({
          id: 'user-1',
          email: 'test@example.com',
          displayName: 'New Name',
          role: 'user',
        }),
      ),
    );

    const user = userEvent.setup();
    renderWithProviders(<ProfilePage />);

    await waitFor(() => {
      expect(screen.getByLabelText(/display name/i)).toBeInTheDocument();
    });

    // Wait for the user to be loaded so the input has a value
    await waitFor(() => {
      expect(screen.getByDisplayValue('Test User')).toBeInTheDocument();
    });

    const input = screen.getByLabelText(/display name/i);
    await user.clear(input);
    await user.type(input, 'New Name');
    await user.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      expect(screen.getByText(/display name updated/i)).toBeInTheDocument();
    });
  });
});
