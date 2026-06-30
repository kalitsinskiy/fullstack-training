import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'

const FAKE_TOKEN = 'fake-token'
const FAKE_USER = { id: 'user-1', email: 'user@test.com', displayName: 'Test User' }

export const handlers = [
  // Auth
  http.post('http://localhost:3001/api/auth/login', async ({ request }) => {
    const body = await request.json() as { email?: string }
    if (body.email === 'wrong@test.com') {
      return HttpResponse.json({ message: 'Invalid credentials' }, { status: 401 })
    }
    return HttpResponse.json({ accessToken: FAKE_TOKEN })
  }),

  http.post('http://localhost:3001/api/auth/register', async ({ request }) => {
    const body = await request.json() as { email?: string; displayName?: string }
    if (body.email === 'taken@test.com') {
      return HttpResponse.json({ message: 'Email already taken' }, { status: 409 })
    }
    return HttpResponse.json(
      { id: 'user-2', email: body.email ?? '', displayName: body.displayName ?? '', accessToken: FAKE_TOKEN },
      { status: 201 },
    )
  }),

  http.get('http://localhost:3001/api/users/me', ({ request }) => {
    const auth = request.headers.get('Authorization')
    if (!auth) return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })
    return HttpResponse.json(FAKE_USER)
  }),

  // Rooms
  http.get('http://localhost:3001/api/rooms', () => {
    return HttpResponse.json({
      data: [
        { id: 'room-1', name: 'Holiday Party', code: 'ABCD', members: ['user-1', 'user-2'], status: 'pending' },
        { id: 'room-2', name: 'Office Santa', code: 'WXYZ', members: ['user-1'], status: 'drawn' },
      ],
      meta: { total: 2, page: 1, limit: 10, totalPages: 1 },
    })
  }),

  http.get('http://localhost:3001/api/rooms/:id', ({ params }) => {
    const { id } = params as { id: string }
    if (id === 'room-1') {
      return HttpResponse.json({
        id: 'room-1', name: 'Holiday Party', code: 'ABCD',
        members: ['user-1', 'user-2'], status: 'pending', ownerId: 'user-1',
      })
    }
    if (id === 'room-2') {
      return HttpResponse.json({
        id: 'room-2', name: 'Office Santa', code: 'WXYZ',
        members: ['user-1'], status: 'drawn', ownerId: 'user-1',
      })
    }
    return HttpResponse.json({ message: 'Not found' }, { status: 404 })
  }),

  http.post('http://localhost:3001/api/rooms', async ({ request }) => {
    const body = await request.json() as { name?: string }
    return HttpResponse.json({ id: 'room-new', name: body.name ?? '', code: 'NEWC', members: [], status: 'pending' }, { status: 201 })
  }),

  http.post('http://localhost:3001/api/rooms/:id/join', async ({ params, request }) => {
    const body = await request.json() as { inviteCode?: string }
    const { id } = params as { id: string }
    if (body.inviteCode !== undefined && body.inviteCode !== 'VALID' && id !== 'VALID') {
      return HttpResponse.json({ message: 'Invalid invite code' }, { status: 400 })
    }
    return HttpResponse.json({ message: 'joined' })
  }),

  // Wishlist
  http.get('http://localhost:3001/api/rooms/:id/wishlist/me', () => {
    return HttpResponse.json({ items: [{ name: 'Book', url: '', priority: 2 }] })
  }),

  http.post('http://localhost:3001/api/rooms/:id/wishlist', async ({ request }) => {
    const body = await request.json()
    return HttpResponse.json(body)
  }),

  // Assignment
  http.get('http://localhost:3001/api/rooms/:id/assignment', () => {
    return HttpResponse.json({ message: 'No draw yet' }, { status: 404 })
  }),

  http.get('http://localhost:3001/api/rooms/:id/assignment/wishlist', () => {
    return HttpResponse.json({ message: 'No draw yet' }, { status: 404 })
  }),
]

export const server = setupServer(...handlers)
