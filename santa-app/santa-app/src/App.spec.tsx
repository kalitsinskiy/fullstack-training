import { screen } from '@testing-library/react';
import { describe, test, expect } from 'vitest';
import { renderApp } from '@/test/renderApp';
import { ALICE, tokenFor } from '@/test/msw-server';
import App from './App';

describe('App routing', () => {
  test('redirects an unauthenticated visitor to /login', async () => {
    renderApp(<App />, { route: '/rooms' });

    expect(await screen.findByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  test('index route redirects an authenticated user to /rooms', async () => {
    renderApp(<App />, { route: '/', token: tokenFor(ALICE.email) });

    expect(await screen.findByText('Office Party')).toBeInTheDocument();
  });

  test('shows the register page', () => {
    renderApp(<App />, { route: '/register' });

    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
  });

  test('shows the 404 page for unknown routes', () => {
    renderApp(<App />, { route: '/does-not-exist' });

    expect(screen.getByText('404')).toBeInTheDocument();
  });

  test('an authenticated visitor to /login is redirected to /rooms', async () => {
    renderApp(<App />, { route: '/login', token: tokenFor(ALICE.email) });

    expect(await screen.findByText('Office Party')).toBeInTheDocument();
  });
});
