import { describe, it, expect, vi, beforeEach } from 'vitest';
import { toast } from 'sonner';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, screen, waitFor } from '@/test/render';
import { tokenStore } from '@/lib/api';
import { ProfilePage } from './ProfilePage';

beforeEach(() => tokenStore.set('test-token'));

describe('ProfilePage', () => {
  it('shows the current display name and saves an update', async () => {
    const successSpy = vi.spyOn(toast, 'success');
    renderWithProviders(<ProfilePage />, { route: '/profile' });

    const input = await screen.findByLabelText(/display name/i);
    await waitFor(() => expect(input).toHaveValue('Alice'));

    await userEvent.clear(input);
    await userEvent.type(input, 'Alice Santa');
    await userEvent.click(
      screen.getByRole('button', { name: /save changes/i }),
    );

    await waitFor(() =>
      expect(successSpy).toHaveBeenCalledWith('Profile updated'),
    );
    expect(input).toHaveValue('Alice Santa');
  });
});
