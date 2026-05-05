// ============================================
// Data Fetching Example
// ============================================
// A component that fetches data from an API, showing:
// - Loading state with spinner
// - Error state with alert message
// - Success state with data display
// - Empty state
// - Refetch on demand

import { useState, useEffect, useCallback } from 'react';

// ---- Types ----

interface Room {
  id: string;
  name: string;
  code: string;
  memberCount: number;
}

// ---- Fake API (replace with real api.get in a real app) ----

async function fetchRooms(): Promise<Room[]> {
  // Simulates an API call with random behavior for demo purposes
  await new Promise((resolve) => setTimeout(resolve, 1000));

  const shouldFail = Math.random() < 0.2; // 20% chance of failure
  if (shouldFail) {
    throw new Error('Failed to fetch rooms. Server returned 500.');
  }

  return [
    { id: '1', name: 'Office Party', code: 'ABC123', memberCount: 8 },
    { id: '2', name: 'Family Exchange', code: 'DEF456', memberCount: 5 },
    { id: '3', name: 'Friends Xmas', code: 'GHI789', memberCount: 12 },
  ];
}

// ---- RoomList Component ----

function RoomList() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRooms = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await fetchRooms();
      setRooms(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch on mount
  useEffect(() => {
    loadRooms();
  }, [loadRooms]);

  // ---- Loading State ----
  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 40 }}>
        <div style={{ fontSize: 24, marginBottom: 8 }}>Loading...</div>
        <p style={{ color: '#888' }}>Fetching rooms from API</p>
      </div>
    );
  }

  // ---- Error State ----
  if (error) {
    return (
      <div style={{ padding: 20, backgroundColor: '#fdecea', borderRadius: 8, margin: 20 }}>
        <strong style={{ color: '#d32f2f' }}>Error:</strong> {error}
        <div style={{ marginTop: 12 }}>
          <button onClick={loadRooms} style={{ padding: '8px 16px' }}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // ---- Empty State ----
  if (rooms.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>
        <p>No rooms yet. Create one to get started!</p>
      </div>
    );
  }

  // ---- Success State ----
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>Your Rooms ({rooms.length})</h2>
        <button onClick={loadRooms} style={{ padding: '6px 12px' }}>
          Refresh
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 16 }}>
        {rooms.map((room) => (
          <div
            key={room.id}
            style={{
              border: '1px solid #e0e0e0',
              borderRadius: 8,
              padding: 16,
              backgroundColor: '#fff',
            }}
          >
            <h3 style={{ marginTop: 0 }}>{room.name}</h3>
            <p style={{ color: '#666', margin: '4px 0' }}>Code: {room.code}</p>
            <p style={{ color: '#666', margin: '4px 0' }}>{room.memberCount} members</p>
            <button style={{ marginTop: 8, padding: '6px 12px' }}>Open Room</button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---- App ----

export default function DataFetchingApp() {
  return (
    <div style={{ padding: 20, fontFamily: 'sans-serif', maxWidth: 800, margin: '0 auto' }}>
      <h1>Data Fetching Example</h1>
      <p style={{ color: '#666' }}>
        This component fetches rooms from a fake API. There is a 20% chance of error to demonstrate
        the error state and retry logic.
      </p>
      <RoomList />
    </div>
  );
}
