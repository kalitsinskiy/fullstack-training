import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, test, expect } from 'vitest';
import { Route, Routes } from 'react-router';
import { renderApp } from '@/test/renderApp';
import { ALICE, tokenFor } from '@/test/msw-server';
import { Layout } from './Layout';

function renderLayout() {
  return renderApp(
    <Routes>
      <Route path="/login" element={<div>Login screen</div>} />
      <Route element={<Layout />}>
        <Route path="/rooms" element={<div>Rooms content</div>} />
      </Route>
    </Routes>,
    { route: '/rooms', token: tokenFor(ALICE.email) },
  );
}

describe('Layout', () => {
  test('renders the signed-in user and the current page content', async () => {
    renderLayout();

    expect(await screen.findByText(ALICE.displayName)).toBeInTheDocument();
    expect(screen.getByText('Rooms content')).toBeInTheDocument();
  });

  test('logging out clears the session and redirects to /login', async () => {
    const user = userEvent.setup();
    renderLayout();

    await screen.findByText(ALICE.displayName);
    await user.click(screen.getByRole('button', { name: /logout/i }));

    expect(await screen.findByText('Login screen')).toBeInTheDocument();
    expect(localStorage.getItem('token')).toBeNull();
  });
});
