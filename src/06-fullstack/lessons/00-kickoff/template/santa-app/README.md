# Santa App

Secret Santa frontend SPA — React + Vite + TypeScript.

This is the **baseline scaffold**. Pages are intentional stubs marked with
`TODO(lesson NN)` comments — you fill them in as you progress through the
Fullstack block (`src/06-fullstack`).

## Tech Stack

- **React 18** + **TypeScript** + **Vite 6**
- **Tailwind CSS** + **shadcn/ui** (Radix primitives) — design tokens in `src/index.css`
- **React Router v6** — routing (`src/App.tsx`)
- **TanStack Query v5** — server state / data fetching
- **axios** — HTTP client with JWT interceptor (`src/lib/api.ts`)
- **react-hook-form + zod** — forms (wired in lesson 08)
- **socket.io-client** — real-time (wired in lesson 07)
- **sonner** — toasts
- **Vitest + Testing Library + MSW** — tests
- **Playwright** — E2E (fullstack lesson 09)

## Getting Started

```bash
cd santa-app
npm install
cp .env.example .env     # point at your local santa-api / santa-notifications
npm run dev              # http://localhost:5173
```

> The baseline login/register already talk to `santa-api`. Start the backend
> (and MongoDB) first — see the repo-root `docker-compose.yml`.

## Scripts

```bash
npm run dev          # Vite dev server (port 5173)
npm run build        # type-check + production build
npm run preview      # preview the production build
npm run lint         # eslint --fix
npm run type-check   # tsc --noEmit
npm run test         # Vitest (run once)
npm run test:watch   # Vitest watch mode
npm run test:e2e     # Playwright (added in fullstack lesson 09)
```

## Project Structure

```
src/
├── main.tsx                  # entry
├── App.tsx                   # providers + routing
├── index.css                 # Tailwind + design tokens (CSS variables)
├── lib/
│   ├── api.ts                # axios instance + JWT interceptor + tokenStore
│   ├── queryClient.ts        # TanStack Query client
│   └── utils.ts              # cn() class merger
├── features/
│   └── auth/                 # AuthContext, useAuth, AuthGuard
├── components/
│   ├── ui/                   # shadcn primitives (button, input, card, …)
│   ├── layout/               # AppLayout, Sidebar, BottomNav
│   ├── PageHeader.tsx
│   └── EmptyState.tsx
├── pages/                    # one file per route (mostly stubs)
├── types/api.ts              # shared API types (mirror api-contract.md)
└── test/setup.ts             # Vitest setup
```

## Routes

| Route | Component | Auth | Lesson to flesh out |
|-------|-----------|------|---------------------|
| `/` | LandingPage | No | done (baseline) |
| `/login` | LoginPage | No | done; upgrade to RHF+Zod in fe-08 |
| `/register` | RegisterPage | No | done; upgrade to RHF+Zod in fe-08 |
| `/rooms` | RoomListPage | Yes | fullstack 03/04 |
| `/rooms/:id` | RoomDetailPage | Yes | fullstack 03 |
| `/messages` | MessagesPage | Yes | fullstack 07/08 |
| `/notifications` | NotificationsPage | Yes | fullstack 06/07 |
| `/profile` | ProfilePage | Yes | done (read-only) |

## Design System

See the `design/` folder (`design/design-system.md`) for the full token
reference (colors, typography, spacing, radii), the screen mockups, and responsive
patterns. Adapted from a Figma reference; the palette is Santa-warm
(red / pine-green / gold on a cream background).

## Environment Variables

```env
VITE_API_URL=http://localhost:3001    # santa-api
VITE_WS_URL=http://localhost:3002     # santa-notifications (WebSocket)
```
