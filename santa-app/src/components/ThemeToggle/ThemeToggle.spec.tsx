import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { ThemeToggle } from './ThemeToggle';

describe('ThemeToggle', () => {
  test('toggles theme label, icon, and <body> class', async () => {
    const user = userEvent.setup();
    render(<ThemeToggle />, { wrapper: ThemeProvider });

    const toggle = screen.getByRole('button', { name: 'Switch theme to dark theme' });

    await user.click(toggle);

    expect(screen.getByRole('button', { name: 'Switch theme to light theme' })).toBeInTheDocument();
    expect(document.body.classList.contains('dark')).toBe(true);
    expect(document.body.classList.contains('light')).toBe(false);
  });
});
