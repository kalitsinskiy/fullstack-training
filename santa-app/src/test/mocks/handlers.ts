import { http, HttpResponse } from 'msw';

const API = import.meta.env.VITE_API_URL ?? '';

export const handlers = [
  http.post(`${API}/api/auth/login`, () =>
    HttpResponse.json({ accessToken: 'test-token' }),
  ),
  http.get(`${API}/api/users/me`, () =>
    HttpResponse.json({ id: 'user-1', email: 'test@test.com', displayName: 'Test User', role: 'user' }),
  ),
  http.get(`${API}/api/rooms`, () =>
    HttpResponse.json({
      data: [],
      meta: { total: 0, page: 1, limit: 10, totalPages: 0 },
    }),
  ),
];
