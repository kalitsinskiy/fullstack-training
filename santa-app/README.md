# Santa App

Secret Santa frontend SPA built with React + Vite + TypeScript.

## Tech Stack

- **React 18** + TypeScript
- **Vite** (build tool)
- **React Router v6** (routing)
- **Material UI** (component library)
- **Styled Components** / CSS Modules (styling)
- **Socket.IO Client** (real-time)
- **React Testing Library** (testing)

## Pages

| Route | Component | Auth | Description |
|-------|-----------|------|-------------|
| /login | LoginPage | No | Login form |
| /register | RegisterPage | No | Registration form |
| /rooms | RoomListPage | Yes | Dashboard with room list |
| /rooms/:id | RoomDetailPage | Yes | Room detail (participants, wishlist, draw) |
| /rooms/:id/messages | MessagesPage | Yes | Anonymous messaging |
| /notifications | NotificationsPage | Yes | Notification list |

## Getting Started

```bash
cd santa-app
npm install
cp .env.example .env
npm run dev
```

## Scripts

```bash
npm run dev      # Development server (port 5173)
npm run build    # Production build
npm run preview  # Preview production build
npm run test     # Run tests
npm run lint     # Lint
```

## Environment Variables

```env
VITE_API_URL=http://localhost:3001
VITE_WS_URL=http://localhost:3002
```

## Port

Runs on **port 5173** by default (Vite dev server).
