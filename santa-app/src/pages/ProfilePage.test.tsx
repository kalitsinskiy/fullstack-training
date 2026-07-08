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
