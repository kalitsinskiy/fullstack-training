import { describe, it, expect } from 'vitest';
import { renderWithProviders, screen } from '@/test/render';
import { LandingPage } from './LandingPage';

describe('LandingPage', () => {
  it('renders the heading and CTA links', () => {
    renderWithProviders(<LandingPage />);

    expect(
      screen.getByRole('heading', { name: /secret santa/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /get started/i })).toHaveAttribute(
      'href',
      '/register',
    );
    expect(screen.getByRole('link', { name: /sign in/i })).toHaveAttribute(
      'href',
      '/login',
    );
  });

  it('renders the three feature headings', () => {
    renderWithProviders(<LandingPage />);

    expect(
      screen.getByRole('heading', { name: /create rooms/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /draw names/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /share wishlists/i }),
    ).toBeInTheDocument();
  });
});
