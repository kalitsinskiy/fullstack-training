import { describe, test, expect, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import RoomCard from './RoomCard'
import RoomList from './RoomList'

describe('RoomCard', () => {
  test('expands details when More button is clicked', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <RoomCard status="pending" name="Test Room" code="ABCD" memberCount={3} onOpen={() => {}} />
      </MemoryRouter>,
    )

    await user.click(screen.getByRole('button', { name: /more/i }))
    expect(screen.getByText(/less/i)).toBeInTheDocument()
    expect(screen.getByText(/3 participants/i)).toBeInTheDocument()
  })

  test('onOpen called for pending room', async () => {
    const user = userEvent.setup()
    const onOpen = vi.fn()
    render(
      <MemoryRouter>
        <RoomCard status="pending" name="Test Room" code="ABCD" memberCount={2} onOpen={onOpen} />
      </MemoryRouter>,
    )
    await user.click(screen.getByRole('button', { name: /^join$/i }))
    expect(onOpen).toHaveBeenCalledOnce()
  })

  test('onView called for drawn room', async () => {
    const user = userEvent.setup()
    const onView = vi.fn()
    render(
      <MemoryRouter>
        <RoomCard status="drawn" name="Test Room" code="WXYZ" memberCount={4} onView={onView} />
      </MemoryRouter>,
    )
    await user.click(screen.getByRole('button', { name: /^view$/i }))
    expect(onView).toHaveBeenCalledOnce()
  })
})

describe('RoomList', () => {
  test('renders empty state', () => {
    render(<MemoryRouter><RoomList rooms={[]} /></MemoryRouter>)
    expect(screen.getByText(/no rooms yet/i)).toBeInTheDocument()
  })

  test('calls onJoinRoom when Join clicked', async () => {
    const user = userEvent.setup()
    const onJoinRoom = vi.fn()
    render(
      <MemoryRouter>
        <RoomList
          rooms={[{ id: 'r1', name: 'Room One', code: 'AAAA', memberCount: 1, status: 'pending' }]}
          onJoinRoom={onJoinRoom}
        />
      </MemoryRouter>,
    )
    await user.click(screen.getByRole('button', { name: /^join$/i }))
    expect(onJoinRoom).toHaveBeenCalledWith('r1')
  })
})
