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
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  Stack,
  Typography,
} from '@mui/material';

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
  { id: '1', name: 'Office Party 2025', code: 'ABC123', memberCount: 8, status: 'pending' },
  { id: '2', name: 'Family Exchange', code: 'DEF456', memberCount: 5, status: 'drawn' },
  { id: '3', name: 'Friends Christmas', code: 'GHI789', memberCount: 12, status: 'closed' },
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

const muiBadgeColor: Record<Room['status'], 'warning' | 'success' | 'default'> = {
  pending: 'warning',
  drawn: 'success',
  closed: 'default',
};

function RoomCardMUI({ room, onOpen }: RoomCardProps) {
  return (
    <Card
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        transition: 'box-shadow 200ms',
        '&:hover': { boxShadow: 6 },
      }}
    >
      <CardContent sx={{ flexGrow: 1 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 1,
          }}
        >
          <Typography variant="h6" component="h3" noWrap sx={{ fontWeight: 600 }}>
            {room.name}
          </Typography>
          <Chip color={muiBadgeColor[room.status]} label={room.status} size="small" />
        </Box>
        <Stack direction="row" spacing={1} sx={{ mt: 1, color: 'text.secondary' }}>
          <Typography variant="body2" component="span">
            Code:{' '}
            <Box component="span" sx={{ fontFamily: 'monospace' }}>
              {room.code}
            </Box>
          </Typography>
          <Typography variant="body2" component="span">
            ·
          </Typography>
          <Typography variant="body2" component="span">
            {room.memberCount} members
          </Typography>
        </Stack>
      </CardContent>
      <CardActions sx={{ justifyContent: 'flex-end' }}>
        <Button size="small" variant="contained" onClick={onOpen}>
          Open
        </Button>
      </CardActions>
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

const cn = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(' ');

const tailwindBadge: Record<Room['status'], string> = {
  pending: 'bg-amber-100 text-amber-800',
  drawn: 'bg-emerald-100 text-emerald-800',
  closed: 'bg-slate-100 text-slate-600',
};

function RoomCardShadcn({ room, onOpen }: RoomCardProps) {
  return (
    <div className="flex flex-col rounded-lg border border-slate-200 bg-white text-slate-900 shadow-sm transition-shadow duration-200 hover:shadow-md">
      <div className="flex flex-col gap-1.5 p-6">
        <div className="flex items-start justify-between gap-2">
          <h3 className="truncate text-lg font-semibold leading-none tracking-tight">
            {room.name}
          </h3>
          <span
            className={cn(
              'shrink-0 rounded-full px-2 py-0.5 text-xs font-medium capitalize',
              tailwindBadge[room.status]
            )}
          >
            {room.status}
          </span>
        </div>
        <p className="text-sm text-slate-500">
          Code: <span className="font-mono">{room.code}</span> · {room.memberCount} members
        </p>
      </div>
      <div className="mt-auto flex items-center justify-end p-6 pt-0">
        <button
          type="button"
          onClick={onOpen}
          className="inline-flex h-9 items-center justify-center rounded-md bg-slate-900 px-3 text-sm font-medium text-white transition-colors hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
        >
          Open
        </button>
      </div>
    </div>
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
      <header style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
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
