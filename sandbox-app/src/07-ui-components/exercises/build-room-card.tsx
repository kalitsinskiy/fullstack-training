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

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { cva, type VariantProps } from 'class-variance-authority';

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

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function RoomCardMUI({ room, onOpen }): RoomCardProps {
  const statusColor = {
    pending: 'warning',
    drawn: 'success',
    closed: 'default',
  };

  return (
    <Card
      sx={{
        transition: 'box-shadow 0.15s ease',
        '&:hover': { boxShadow: 6 },
      }}
    >
      <CardContent>
        <Stack
          direction="row"
          spacing={1}
          sx={{ justifyContent: 'space-between', alignItems: 'flex-start' }}
        >
          <Typography variant="h6" component="h3" sx={{ fontWeight: 600, lineHeight: 1.3 }}>
            {room.name}
          </Typography>
          <Chip
            label={room.status}
            color={statusColor[room.status]}
            size="small"
            sx={{ textTransform: 'capitalize', flexShrink: 0 }}
          />
        </Stack>
        <Box sx={{ mt: 1 }}>
          <Typography variant="body2" color="textSecondary">
            Code:{' '}
            <Box component="span" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
              {room.code}
            </Box>
          </Typography>
          <Typography variant="body2" color="textSecondary">
            {room.memberCount} members
          </Typography>
        </Box>
      </CardContent>
      <CardActions sx={{ justifyContent: 'flex-end', pt: 0 }}>
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
const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize',
  {
    variants: {
      status: {
        pending: 'bg-amber-100 text-amber-800',
        drawn: 'bg-emerald-100 text-emerald-800',
        closed: 'bg-slate-100 text-slate-600',
      },
    },
  }
);

function RoomCardShadcn({ room, onOpen }): RoomCardProps {
  return (
    <div
      className={cn(
        'rounded-lg border border-gray-200 bg-white p-4 shadow-sm',
        'transition-shadow duration-150 hover:shadow-md'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="min-w-0 truncate text-base font-semibold leading-snug text-gray-900">
          {room.name}
        </h3>
        <span className={cn(badgeVariants({ status: room.status }), 'shrink-0')}>
          {room.status}
        </span>
      </div>
      <div className="mt-2 space-y-0.5">
        <p className="text-sm text-gray-500">
          Code: <span className="font-mono font-semibold text-gray-700">{room.code}</span>
        </p>
        <p className="text-sm text-gray-500">{room.memberCount} members</p>
      </div>

      <div className="mt-4 flex justify-end">
        <button
          onClick={onOpen}
          className={cn(
            'rounded-md bg-gray-900 px-3 py-1.5 text-sm font-medium text-white',
            'transition-colors duration-150 hover:bg-gray-700',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900'
          )}
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
        <button
          onClick={() => setPath('A')}
          disabled={path === 'A'}
          className={cn(
            'py-2 px-4 rounded-full bg-gray-100 text-black cursor-pointer',
            'hover:bg-gray-300',
            path === 'A' && 'bg-green-500'
          )}
        >
          Path A — MUI
        </button>
        <button
          onClick={() => setPath('B')}
          disabled={path === 'B'}
          className={cn(
            'py-2 px-4 rounded-full bg-gray-100 text-black cursor-pointer',
            'hover:bg-gray-300',
            path === 'B' && 'bg-green-500'
          )}
        >
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
