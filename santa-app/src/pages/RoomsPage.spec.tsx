import { describe, test, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { server } from '../test/msw-server'
import { renderApp } from '../test/renderApp'
import RoomsPage from './RoomsPage'

describe('RoomsPage', () => {
  test('shows loading state initially', () => {
    renderApp(<RoomsPage />, { route: '/rooms' })
    expect(screen.getByText(/loading rooms/i)).toBeInTheDocument()
  })

  test('renders room list after data loads', async () => {
    renderApp(<RoomsPage />, { route: '/rooms' })
    expect(await screen.findByText('Holiday Party')).toBeInTheDocument()
    expect(screen.getByText('Office Santa')).toBeInTheDocument()
  })

  test('shows empty state when no rooms', async () => {
    server.use(
      http.get('http://localhost:3001/api/rooms', () =>
        HttpResponse.json({ data: [], meta: { total: 0, page: 1, limit: 10, totalPages: 0 } }),
      ),
    )
    renderApp(<RoomsPage />, { route: '/rooms' })
    expect(await screen.findByText(/no rooms yet/i)).toBeInTheDocument()
  })

  test('shows error state when request fails', async () => {
    server.use(
      http.get('http://localhost:3001/api/rooms', () =>
        HttpResponse.json({ message: 'Server error' }, { status: 500 }),
      ),
    )
    renderApp(<RoomsPage />, { route: '/rooms' })
    expect(await screen.findByText(/failed to load rooms/i)).toBeInTheDocument()
  })
})
