import { describe, test, expect } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http, HttpResponse } from 'msw'
import { server } from '../test/msw-server'
import { AuthProvider } from '../contexts/AuthContext'
import RoomDetailPage from './RoomDetailPage'

function renderRoom(roomId: string) {
  localStorage.setItem('token', 'fake-token')
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: 0 } } })
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[`/rooms/${roomId}`]}>
        <AuthProvider>
          <Routes>
            <Route path="/rooms/:id" element={<RoomDetailPage />} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('RoomDetailPage', () => {
  test('shows loading state', () => {
    renderRoom('room-1')
    expect(screen.getByText(/loading room/i)).toBeInTheDocument()
  })

  test('renders room name and member count', async () => {
    renderRoom('room-1')
    expect(await screen.findByText('Holiday Party')).toBeInTheDocument()
    expect(screen.getByText(/2 members/i)).toBeInTheDocument()
  })

  test('shows error when room not found', async () => {
    renderRoom('room-999')
    expect(await screen.findByText(/failed to load room/i)).toBeInTheDocument()
  })

  test('Trigger Draw button fires POST mutation', async () => {
    const user = userEvent.setup()
    let drawCalled = false
    server.use(
      http.post('http://localhost:3001/api/rooms/:id/draw', () => {
        drawCalled = true
        return HttpResponse.json({ ok: true })
      }),
    )
    renderRoom('room-1')
    await screen.findByText('Holiday Party')

    const drawBtn = await screen.findByRole('button', { name: /trigger draw/i })
    await user.click(drawBtn)

    await waitFor(() => expect(drawCalled).toBe(true))
  })
})
