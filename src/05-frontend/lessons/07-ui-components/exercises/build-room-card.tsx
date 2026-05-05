/**
 * Exercise: Build the same RoomCard, two ways
 *
 * The component:
 *   - Shows: room name (h3), invite code (mono font), member count, status badge,
 *     "Open" button on the right
 *   - Status badge colors: pending=amber, drawn=green, closed=slate
 *   - On hover: subtle shadow lift
 *   - Should look usable on both 320px (phone) and 1200px (desktop)
 *
 * Pick PATH A or PATH B and implement that one. Optionally do both.
 *
 *   Path A — Material UI
 *   Path B — Tailwind + shadcn-style primitives
 *
 * Required imports/setup are listed below the component spec.
 *
 * Test by rendering <RoomCardDemo /> in your Vite app:
 *
 *   import { RoomCardDemo } from './exercises/build-room-card';
 *   function App() { return <RoomCardDemo />; }
 */

/* eslint-disable */
// @ts-nocheck — exercise file. Pick one path, remove the no-check directive after you fill it in.

import { useState } from 'react';

interface Room {
  id: string;
  name: string;
  code: string;
  memberCount: number;
  status: 'pending' | 'drawn' | 'closed';
}

interface RoomCardProps {
  room: Room;
  onOpen: () => void;
}

const sampleRooms: Room[] = [
  { id: '1', name: 'Office Party 2025', code: 'ABC123', memberCount: 8,  status: 'pending' },
  { id: '2', name: 'Family Exchange',   code: 'DEF456', memberCount: 5,  status: 'drawn'   },
  { id: '3', name: 'Friends Christmas', code: 'GHI789', memberCount: 12, status: 'closed'  },
];

// ================================================
// PATH A — Material UI
// ================================================
//
// npm install @mui/material @emotion/react @emotion/styled @mui/icons-material
//
// Use these MUI primitives:
//   Card, CardContent, CardActions, Typography, Button, Chip, Box, Stack
//
// Tip: <Chip color="warning|success|default" label={room.status} size="small" />

// TODO PATH A: implement RoomCardMUI using MUI components.
// Replace this stub with your implementation.

function RoomCardMUI(_props: RoomCardProps) {
  return null; // TODO
}

// ================================================
// PATH B — Tailwind + shadcn-style
// ================================================
//
// Setup (one-time):
//   npm install -D tailwindcss @tailwindcss/vite clsx tailwind-merge class-variance-authority
//
// You may either:
//   a) Run `npx shadcn@latest add button card` and use the generated files.
//   b) Hand-roll a Card composition like in examples/shadcn-concept.tsx.
//
// Either way, the leaf component should accept the same RoomCardProps shape.

// TODO PATH B: implement RoomCardShadcn using Tailwind utilities (and Radix-based dialog later).
// Replace this stub with your implementation.

function RoomCardShadcn(_props: RoomCardProps) {
  return null; // TODO
}

// ================================================
// DEMO — switch between paths via a toggle
// ================================================

export function RoomCardDemo() {
  const [path, setPath] = useState<'A' | 'B'>('A');

  const Renderer = path === 'A' ? RoomCardMUI : RoomCardShadcn;

  return (
    <div style={{ padding: 24, fontFamily: 'system-ui, sans-serif' }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>RoomCard exercise</h2>
        <button onClick={() => setPath('A')} disabled={path === 'A'}>Path A — MUI</button>
        <button onClick={() => setPath('B')} disabled={path === 'B'}>Path B — Tailwind</button>
      </header>

      <div
        style={{
          display: 'grid',
          gap: 16,
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        }}
      >
        {sampleRooms.map((room) => (
          <Renderer key={room.id} room={room} onOpen={() => alert(`Opening ${room.name}`)} />
        ))}
      </div>
    </div>
  );
}

export default RoomCardDemo;
