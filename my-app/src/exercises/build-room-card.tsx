import { useState } from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Chip,
  Box,
  Stack,
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
  { id: '1', name: 'Office Party 2026', code: 'ABC123', memberCount: 8, status: 'pending' },
  { id: '2', name: 'Family Exchange', code: 'DEF456', memberCount: 5, status: 'drawn' },
  { id: '3', name: 'Friends Christmas', code: 'GHI789', memberCount: 12, status: 'closed' },
];

const statusColor: Record<Room['status'], 'warning' | 'success' | 'default'> = {
  pending: 'warning',
  drawn: 'success',
  closed: 'default',
};

function RoomCardMUI({ room, onOpen }: RoomCardProps) {
  return (
    <Card
      variant="outlined"
      sx={{
        transition: 'box-shadow 0.2s',
        '&:hover': { boxShadow: 4 },
      }}
    >
      <CardContent>
        <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
          <Typography variant="h6" component="h3" noWrap sx={{ flexGrow: 1 }}>
            {room.name}
          </Typography>
          <Chip label={room.status} color={statusColor[room.status]} size="small" />
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Code:{' '}
          <Box component="span" sx={{ fontFamily: 'monospace' }}>
            {room.code}
          </Box>
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {room.memberCount} members
        </Typography>
      </CardContent>
      <CardActions sx={{ justifyContent: 'flex-end', pt: 0 }}>
        <Button size="small" variant="contained" onClick={onOpen}>
          Open
        </Button>
      </CardActions>
    </Card>
  );
}

export function RoomCardDemo() {
  const [path, setPath] = useState<'A' | 'B'>('A');

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
        {/* Only Path A (MUI) is implemented */}
        {path === 'A' &&
          sampleRooms.map((room) => (
            <RoomCardMUI key={room.id} room={room} onOpen={() => alert(`Opening ${room.name}`)} />
          ))}
        {path === 'B' && <p style={{ color: '#888' }}>Path B (Tailwind) not implemented yet.</p>}
      </div>
    </div>
  );
}

export default RoomCardDemo;
