import { describe, test, expect } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http, HttpResponse } from 'msw'
import { server } from '../test/msw-server'
import { AuthProvider } from '../contexts/AuthContext'
import WishlistEditor from './WishlistEditor'

function renderEditor(roomId = 'room-1') {
  localStorage.setItem('token', 'fake-token')
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: 0 } } })
  return render(
    <MemoryRouter>
      <QueryClientProvider client={qc}>
        <AuthProvider>
          <WishlistEditor roomId={roomId} />
        </AuthProvider>
      </QueryClientProvider>
    </MemoryRouter>,
  )
}

describe('WishlistEditor', () => {
  test('loads and displays existing wishlist items', async () => {
    renderEditor()
    expect(await screen.findByDisplayValue('Book')).toBeInTheDocument()
  })

  test('adds a new item row when Add item is clicked', async () => {
    const user = userEvent.setup()
    renderEditor()
    await screen.findByDisplayValue('Book')

    const initial = screen.getAllByLabelText(/item name/i).length
    await user.click(screen.getByRole('button', { name: /\+ add item/i }))
    expect(screen.getAllByLabelText(/item name/i)).toHaveLength(initial + 1)
  })

  test('remove button disabled when only one item remains', async () => {
    server.use(
      http.get('http://localhost:3001/api/rooms/:id/wishlist/me', () =>
        HttpResponse.json({ items: [{ name: 'Single Item', url: '', priority: 1 }] }),
      ),
    )
    renderEditor()
    const removeBtn = await screen.findByRole('button', { name: /remove item/i })
    expect(removeBtn).toBeDisabled()
  })

  test('shows Zod validation error when item name is empty on submit', async () => {
    const user = userEvent.setup()
    server.use(
      http.get('http://localhost:3001/api/rooms/:id/wishlist/me', () =>
        HttpResponse.json({ items: [] }),
      ),
    )
    renderEditor()
    await waitFor(() => expect(screen.queryByText(/loading wishlist/i)).not.toBeInTheDocument())

    const nameInput = screen.getByLabelText(/item name \*/i)
    await user.clear(nameInput)
    await user.click(screen.getByRole('button', { name: /^save$/i }))

    expect(await screen.findByText(/required/i)).toBeInTheDocument()
  })

  test('submit fires POST /api/rooms/:id/wishlist', async () => {
    const user = userEvent.setup()
    let saveCalled = false
    server.use(
      http.post('http://localhost:3001/api/rooms/:id/wishlist', () => {
        saveCalled = true
        return HttpResponse.json({ items: [] })
      }),
    )
    renderEditor()
    await screen.findByDisplayValue('Book')

    await user.click(screen.getByRole('button', { name: /^save$/i }))

    await waitFor(() => expect(saveCalled).toBe(true))
  })

  test('shows invalid URL validation error', async () => {
    const user = userEvent.setup()
    renderEditor()
    await screen.findByDisplayValue('Book')

    const urlInput = screen.getByLabelText(/url \(optional\)/i)
    await user.clear(urlInput)
    await user.type(urlInput, 'not-a-url')
    await user.tab()

    expect(await screen.findByText(/invalid url/i)).toBeInTheDocument()
  })
})
