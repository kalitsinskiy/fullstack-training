/**
 * TanStack Query — mutations + cache invalidation + optimistic updates
 *
 * Demonstrates:
 *   - useMutation for create / delete
 *   - invalidateQueries to refresh related data
 *   - Optimistic update with rollback on error (onMutate / onError / onSettled)
 *   - mutation.isPending for the button disabled state
 *
 * Pairs with query-data-fetching.tsx — uses the same ['rooms'] cache slot.
 *
 * To run: same setup as query-data-fetching.tsx (QueryClientProvider, etc.).
 */

import { QueryClient, QueryClientProvider, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

// ---- Types ----

interface Room {
  id: string;
  name: string;
  code: string;
  memberCount: number;
}

// ---- Fake API with mutable in-memory state ----

let rooms: Room[] = [
  { id: '1', name: 'Office Party',     code: 'ABC123', memberCount: 8 },
  { id: '2', name: 'Family Exchange',  code: 'DEF456', memberCount: 5 },
];
let nextId = 3;

async function fetchRooms() {
  await new Promise((r) => setTimeout(r, 300));
  return [...rooms];
}

async function createRoom(name: string): Promise<Room> {
  await new Promise((r) => setTimeout(r, 400));
  if (Math.random() < 0.3) throw new Error('Server rejected the request');
  const room: Room = { id: String(nextId++), name, code: Math.random().toString(36).slice(2, 8).toUpperCase(), memberCount: 1 };
  rooms = [...rooms, room];
  return room;
}

async function deleteRoom(id: string): Promise<void> {
  await new Promise((r) => setTimeout(r, 400));
  if (Math.random() < 0.3) throw new Error('Failed to delete (random failure for demo)');
  rooms = rooms.filter((r) => r.id !== id);
}

// ---- Components ----

function RoomList() {
  const queryClient = useQueryClient();

  const { data: rooms = [], isLoading } = useQuery({
    queryKey: ['rooms'],
    queryFn: fetchRooms,
  });

  const remove = useMutation({
    mutationFn: deleteRoom,

    // OPTIMISTIC UPDATE
    onMutate: async (id) => {
      // 1. Cancel any in-flight refetch so it doesn't overwrite our optimistic state
      await queryClient.cancelQueries({ queryKey: ['rooms'] });

      // 2. Snapshot the previous list for rollback
      const previous = queryClient.getQueryData<Room[]>(['rooms']);

      // 3. Optimistically remove the room from the cached list
      queryClient.setQueryData<Room[]>(['rooms'], (old) => old?.filter((r) => r.id !== id) ?? []);

      // 4. Return context for onError
      return { previous };
    },
    onError: (_err, _id, ctx) => {
      // Rollback on failure
      if (ctx?.previous) queryClient.setQueryData(['rooms'], ctx.previous);
      alert('Delete failed — rolled back');
    },
    onSettled: () => {
      // Refetch from server to make sure cache matches reality
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
    },
  });

  if (isLoading) return <p>Loading…</p>;

  return (
    <ul style={{ listStyle: 'none', padding: 0 }}>
      {rooms.map((room) => (
        <li
          key={room.id}
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 8, borderBottom: '1px solid #eee' }}
        >
          <span>
            <strong>{room.name}</strong> — {room.code} — {room.memberCount} members
          </span>
          <button
            onClick={() => remove.mutate(room.id)}
            disabled={remove.isPending && remove.variables === room.id}
          >
            {remove.isPending && remove.variables === room.id ? 'Deleting…' : 'Delete'}
          </button>
        </li>
      ))}
    </ul>
  );
}

function CreateRoomForm() {
  const [name, setName] = useState('');
  const queryClient = useQueryClient();

  const create = useMutation({
    mutationFn: createRoom,
    onSuccess: () => {
      // Tell the cache "the rooms list is stale" — RoomList will refetch.
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      setName('');
    },
    onError: (err) => alert(`Create failed: ${(err as Error).message}`),
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!name.trim()) return;
        create.mutate(name.trim());
      }}
      style={{ display: 'flex', gap: 8, marginBottom: 12 }}
    >
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="New room name"
        style={{ flex: 1, padding: 6 }}
      />
      <button type="submit" disabled={create.isPending || !name.trim()}>
        {create.isPending ? 'Creating…' : 'Create'}
      </button>
    </form>
  );
}

// ---- Demo wrapper ----

const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 5_000 } } });

export default function QueryMutationsApp() {
  return (
    <QueryClientProvider client={queryClient}>
      <div style={{ padding: 20, fontFamily: 'system-ui, sans-serif', maxWidth: 600, margin: '0 auto' }}>
        <h1>Mutations + Optimistic Updates</h1>
        <p style={{ color: '#666' }}>
          Create has a 30% random failure rate. Delete has a 30% random failure rate too —
          the optimistic UI shows the row removed instantly, then puts it back if the server rejected.
        </p>
        <CreateRoomForm />
        <RoomList />
      </div>
    </QueryClientProvider>
  );
}
