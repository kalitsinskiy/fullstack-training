import { describe, test, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { Routes, Route } from 'react-router';
import { renderApp } from '@/test/renderApp';
import { ProtectedRoute } from './ProtectedRoute';

function Tree() {
  return (
    <Routes>
      <Route path="/login" element={<div>Login screen</div>} />
      <Route element={<ProtectedRoute />}>
        <Route path="/rooms" element={<div>Rooms screen</div>} />
      </Route>
    </Routes>
  );
}

describe('ProtectedRoute', () => {
  test('redirect to /login when not authenticated', () => {
    renderApp(<Tree />, { route: '/rooms', authed: false });

    expect(screen.getByText('Login screen')).toBeInTheDocument();
    expect(screen.queryByText('Rooms screen')).not.toBeInTheDocument();
  });

  test('renders the protected route element when authenticated', async () => {
    renderApp(<Tree />, { route: '/rooms', authed: true });

    expect(await screen.findByText('Rooms screen')).toBeInTheDocument();
  });
});
