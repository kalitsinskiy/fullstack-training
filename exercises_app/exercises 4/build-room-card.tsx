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

import { Card, CardContent, CardActions, Typography, Button, Chip, Box } from '@mui/material';

// TODO PATH A: implement RoomCardMUI using MUI components.
// Replace this stub with your implementation.]

const statusChipColor: Record<Room['status'], 'warning' | 'success' | 'default'> = {
  pending: 'warning',
  drawn: 'success',
  closed: 'default',
};

function RoomCardMUI(_props: RoomCardProps) {
  const { room, onOpen } = _props;

  return (
    <Card
      variant="outlined"
      sx={{
        transition: 'box-shadow 0.2s',
        '&:hover': { boxShadow: 4 },
      }}
    >
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between" gap={1} mb={0.5}>
          <Typography variant="h6" component="h3" fontWeight={600}>
            {room.name}
          </Typography>
          <Chip
            label={room.status}
            color={statusChipColor[room.status]}
            size="small"
          />
        </Box>
        <Typography variant="body2" fontFamily="monospace" color="text.secondary">
          {room.code}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {room.memberCount} members
        </Typography>
      </CardContent>
      <CardActions sx={{ justifyContent: 'flex-end', pt: 0 }}>
        <Button variant="contained" size="small" onClick={onOpen}>
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

import { Card as SCard, CardContent as SCardContent, CardFooter as SCardFooter } from '@/components/ui/card';
import { Button as SButton } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const statusBadge: Record<Room['status'], string> = {
  pending: 'bg-amber-100 text-amber-800',
  drawn:   'bg-green-100 text-green-800',
  closed:  'bg-slate-100  text-slate-600',
};

function RoomCardShadcn(_props: RoomCardProps) {
  const { room, onOpen } = _props;

  return (
    <SCard className="transition-shadow hover:shadow-md">
      <SCardContent className="pt-6">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-base">{room.name}</h3>
          <span className={cn('rounded-full px-2 py-0.5 text-xs font-semibold', statusBadge[room.status])}>
            {room.status}
          </span>
        </div>
        <p className="font-mono text-sm text-muted-foreground mt-1">{room.code}</p>
        <p className="text-sm text-muted-foreground">{room.memberCount} members</p>
      </SCardContent>
      <SCardFooter className="justify-end">
        <SButton size="sm" onClick={onOpen}>Open</SButton>
      </SCardFooter>
    </SCard>
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
