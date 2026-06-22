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
import { Button } from '../components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../components/ui/card';

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
  {
    id: '1',
    name: 'Office Party 2025',
    code: 'ABC123',
    memberCount: 8,
    status: 'pending',
  },
  {
    id: '2',
    name: 'Family Exchange',
    code: 'DEF456',
    memberCount: 5,
    status: 'drawn',
  },
  {
    id: '3',
    name: 'Friends Christmas',
    code: 'GHI789',
    memberCount: 12,
    status: 'closed',
  },
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

function RoomCardMUI(props: RoomCardProps) {
  const { room, onOpen } = props;

  const badgeClass =
    room.status === 'pending'
      ? 'bg-amber-100 text-amber-800'
      : room.status === 'drawn'
        ? 'bg-emerald-100 text-emerald-800'
        : 'bg-slate-100 text-slate-700';

  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="line-clamp-2 break-words">{room.name}</CardTitle>
          <span
            className={`inline-flex shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${badgeClass}`}
          >
            {room.status}
          </span>
        </div>
        <CardDescription>
          Code: <span className="font-mono">{room.code}</span> · {room.memberCount} members
        </CardDescription>
      </CardHeader>
      <CardContent />
      <CardFooter>
        <Button onClick={onOpen}>Open</Button>
      </CardFooter>
    </Card>
  );
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

function RoomCardShadcn(props: RoomCardProps) {
  const { room, onOpen } = props;

  const badgeClass =
    room.status === 'pending'
      ? 'bg-amber-100 text-amber-800'
      : room.status === 'drawn'
        ? 'bg-emerald-100 text-emerald-800'
        : 'bg-slate-100 text-slate-700';

  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="line-clamp-2 break-words">{room.name}</CardTitle>
          <span
            className={`inline-flex shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${badgeClass}`}
          >
            {room.status}
          </span>
        </div>
        <CardDescription>
          Code: <span className="font-mono">{room.code}</span> · {room.memberCount} members
        </CardDescription>
      </CardHeader>
      <CardFooter>
        <Button size="sm" onClick={onOpen}>
          Open
        </Button>
      </CardFooter>
    </Card>
  );
}

// ================================================
// DEMO — switch between paths via a toggle
// ================================================

export function RoomCardDemo() {
  const [path, setPath] = useState<'A' | 'B'>('A');

  const Renderer = path === 'A' ? RoomCardMUI : RoomCardShadcn;

  return (
    <div style={{ padding: 24, fontFamily: 'system-ui, sans-serif' }}>
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          marginBottom: 16,
        }}
      >
        <h2 style={{ margin: 0 }}>RoomCard exercise</h2>
        <button onClick={() => setPath('A')} disabled={path === 'A'}>
          Path A — MUI
        </button>
        <button onClick={() => setPath('B')} disabled={path === 'B'}>
          Path B — Tailwind
        </button>
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
