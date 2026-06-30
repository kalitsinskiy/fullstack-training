import { describe, test, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { render } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '../contexts/AuthContext'
import { ProtectedRoute } from './ProtectedRoute'
import LoginPage from '../pages/LoginPage'

function renderWithAuth(initialRoute: string, isLoggedIn = false) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })

  if (isLoggedIn) {
    localStorage.setItem('token', 'fake-token')
  } else {
    localStorage.removeItem('token')
  }

  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[initialRoute]}>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/rooms" element={<div>Rooms Page</div>} />
            </Route>
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('ProtectedRoute', () => {
  test('redirects unauthenticated user to /login', async () => {
    renderWithAuth('/rooms', false)
    expect(await screen.findByRole('heading', { name: /sign in/i })).toBeInTheDocument()
  })

  test('renders children when user is authenticated', async () => {
    renderWithAuth('/rooms', true)
    expect(await screen.findByText(/rooms page/i)).toBeInTheDocument()
  })
})
