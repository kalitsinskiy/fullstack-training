import { describe, test, expect, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router'
import { http, HttpResponse } from 'msw'
import { server } from '../test/msw-server'
import { AuthProvider } from './AuthContext'
import { useAuth } from './useAuth'

function AuthDisplay() {
  const auth = useAuth()
  return (
    <div>
      <p data-testid="authenticated">{String(auth.isAuthenticated)}</p>
      <p data-testid="user">{auth.user?.displayName ?? 'none'}</p>
      <button onClick={() => auth.login('user@test.com', 'password123')}>Login</button>
      <button onClick={() => auth.logout()}>Logout</button>
    </div>
  )
}

function renderAuth() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <MemoryRouter>
      <QueryClientProvider client={qc}>
        <AuthProvider>
          <AuthDisplay />
        </AuthProvider>
      </QueryClientProvider>
    </MemoryRouter>,
  )
}

describe('useAuth', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  test('starts unauthenticated when no token stored', async () => {
    renderAuth()
    await waitFor(() =>
      expect(screen.getByTestId('authenticated')).toHaveTextContent('false'),
    )
  })

  test('login stores token and populates user via GET /api/users/me', async () => {
    const user = userEvent.setup()
    renderAuth()
    await user.click(screen.getByRole('button', { name: /login/i }))

    await waitFor(() =>
      expect(screen.getByTestId('authenticated')).toHaveTextContent('true'),
    )
    expect(screen.getByTestId('user')).toHaveTextContent('Test User')
    expect(localStorage.getItem('token')).toBe('fake-token')
  })

  test('logout clears token and user', async () => {
    const user = userEvent.setup()
    renderAuth()
    await user.click(screen.getByRole('button', { name: /login/i }))
    await waitFor(() =>
      expect(screen.getByTestId('authenticated')).toHaveTextContent('true'),
    )

    await user.click(screen.getByRole('button', { name: /logout/i }))
    expect(screen.getByTestId('authenticated')).toHaveTextContent('false')
    expect(localStorage.getItem('token')).toBeNull()
  })

  test('logout calls queryClient.clear() — re-login refetches user', async () => {
    const user = userEvent.setup()
    let meCallCount = 0
    server.use(
      http.get('http://localhost:3001/api/users/me', () => {
        meCallCount++
        return HttpResponse.json({ id: 'user-1', email: 'user@test.com', displayName: 'Test User' })
      }),
    )
    renderAuth()
    await user.click(screen.getByRole('button', { name: /login/i }))
    await waitFor(() => expect(meCallCount).toBeGreaterThan(0))

    const countAfterLogin = meCallCount
    await user.click(screen.getByRole('button', { name: /logout/i }))
    await user.click(screen.getByRole('button', { name: /login/i }))

    await waitFor(() => expect(meCallCount).toBeGreaterThan(countAfterLogin))
  })

  test('reads token from localStorage on mount and fetches user', async () => {
    localStorage.setItem('token', 'fake-token')
    renderAuth()
    await waitFor(() =>
      expect(screen.getByTestId('authenticated')).toHaveTextContent('true'),
    )
  })
})
