import { screen } from '@testing-library/react';
import { describe, test, expect } from 'vitest';
import { Route, Routes } from 'react-router';
import { renderApp } from '@/test/renderApp';
import { ALICE, tokenFor } from '@/test/msw-server';
import { ProtectedRoute } from './ProtectedRoute';

function renderProtected(route: string, token?: string) {
  return renderApp(
    <Routes>
      <Route path="/login" element={<div>Login screen</div>} />
      <Route element={<ProtectedRoute />}>
        <Route path="/rooms" element={<div>Protected content</div>} />
      </Route>
    </Routes>,
    { route, token },
  );
}

describe('ProtectedRoute', () => {
  test('redirects to /login when unauthenticated', async () => {
    renderProtected('/rooms');

    expect(await screen.findByText('Login screen')).toBeInTheDocument();
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
  });

  test('renders children when authenticated', async () => {
    renderProtected('/rooms', tokenFor(ALICE.email));

    expect(await screen.findByText('Protected content')).toBeInTheDocument();
    expect(screen.queryByText('Login screen')).not.toBeInTheDocument();
  });
});
