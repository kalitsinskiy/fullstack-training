/**
 * Lists and Conditionals — Examples
 *
 * Demonstrates list rendering with .map() and key, and conditional rendering patterns.
 * To run: copy into a Vite + React + TS project and import in App.tsx
 *
 *   import ListsAndConditionalsDemo from './lists-and-conditionals';
 *   function App() { return <ListsAndConditionalsDemo />; }
 */

import { useState } from 'react';

// ================================================
// 1. BASIC LIST RENDERING
// ================================================

interface Room {
  id: string;
  name: string;
  participants: number;
  budget: number;
  status: 'open' | 'drawn' | 'closed';
}

const sampleRooms: Room[] = [
  { id: 'r1', name: 'Engineering Team', participants: 12, budget: 25, status: 'open' },
  { id: 'r2', name: 'Family Holiday', participants: 8, budget: 50, status: 'drawn' },
  { id: 'r3', name: 'Book Club Swap', participants: 6, budget: 15, status: 'open' },
  { id: 'r4', name: 'College Friends', participants: 10, budget: 30, status: 'closed' },
];

const badgeColors: Record<string, string> = {
  open: '#27ae60',
  drawn: '#2980b9',
  closed: '#7f8c8d',
};

function RoomList({ rooms }: { rooms: Room[] }) {
  // Each item MUST have a unique key — use the room's id, not the index
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {rooms.map(room => (
        <div
          key={room.id}
          style={{
            border: '1px solid #ddd',
            borderRadius: '8px',
            padding: '1rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <strong>{room.name}</strong>
            <p style={{ margin: '0.25rem 0 0', color: '#666', fontSize: '0.9rem' }}>
              {room.participants} participants &middot; ${room.budget} budget
            </p>
          </div>
          <span style={{
            background: badgeColors[room.status],
            color: 'white',
            padding: '0.2rem 0.6rem',
            borderRadius: '12px',
            fontSize: '0.8rem',
            fontWeight: 600,
          }}>
            {room.status.charAt(0).toUpperCase() + room.status.slice(1)}
          </span>
        </div>
      ))}
    </div>
  );
}

// ================================================
// 2. CONDITIONAL RENDERING PATTERNS
// ================================================

function ConditionalExamples() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [notifications, setNotifications] = useState(3);

  return (
    <div style={{ marginBottom: '1.5rem' }}>
      {/* Pattern 1: Ternary — show one thing or another */}
      <p>
        Status: {isLoggedIn ? (
          <span style={{ color: '#27ae60', fontWeight: 'bold' }}>Logged In</span>
        ) : (
          <span style={{ color: '#c0392b', fontWeight: 'bold' }}>Logged Out</span>
        )}
      </p>

      <button
        onClick={() => setIsLoggedIn(prev => !prev)}
        style={{
          background: isLoggedIn ? '#c0392b' : '#2d5a27',
          color: 'white',
          border: 'none',
          padding: '0.5rem 1rem',
          borderRadius: '4px',
          cursor: 'pointer',
          marginBottom: '1rem',
        }}
      >
        {isLoggedIn ? 'Log Out' : 'Log In'}
      </button>

      {/* Pattern 2: && — render only if condition is true */}
      {isLoggedIn && (
        <div style={{
          background: '#e8f5e9',
          padding: '0.75rem',
          borderRadius: '8px',
          marginBottom: '1rem',
        }}>
          Welcome back! You are logged in.
        </div>
      )}

      {/* Pattern 3: && with numbers — be careful! */}
      {/* BAD: {notifications && <p>...</p>} would render "0" when notifications is 0 */}
      {/* GOOD: check explicitly */}
      {notifications > 0 && (
        <p style={{ marginBottom: '0.5rem' }}>
          You have <strong>{notifications}</strong> notification{notifications !== 1 ? 's' : ''}.
        </p>
      )}

      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button onClick={() => setNotifications(prev => prev + 1)}>
          Add Notification
        </button>
        <button onClick={() => setNotifications(0)}>
          Clear All
        </button>
      </div>
    </div>
  );
}

// ================================================
// 3. EARLY RETURN PATTERN
// ================================================

interface RoomDetailProps {
  room: Room | null;
  isLoading: boolean;
  error: string | null;
}

function RoomDetail({ room, isLoading, error }: RoomDetailProps) {
  // Early return for loading state
  if (isLoading) {
    return <p style={{ color: '#666', fontStyle: 'italic' }}>Loading room details...</p>;
  }

  // Early return for error state
  if (error) {
    return <p style={{ color: '#c0392b' }}>Error: {error}</p>;
  }

  // Early return for missing data
  if (!room) {
    return <p style={{ color: '#666' }}>Room not found.</p>;
  }

  // Happy path — render the room
  return (
    <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '1rem' }}>
      <h4>{room.name}</h4>
      <p>{room.participants} participants &middot; ${room.budget} budget</p>
      <span style={{
        background: badgeColors[room.status],
        color: 'white',
        padding: '0.2rem 0.6rem',
        borderRadius: '12px',
        fontSize: '0.8rem',
        fontWeight: 600,
      }}>
        {room.status.charAt(0).toUpperCase() + room.status.slice(1)}
      </span>
    </div>
  );
}

function EarlyReturnDemo() {
  const [scenario, setScenario] = useState<'loading' | 'error' | 'empty' | 'data'>('data');

  const props: RoomDetailProps = {
    isLoading: scenario === 'loading',
    error: scenario === 'error' ? 'Failed to fetch room' : null,
    room: scenario === 'data' ? sampleRooms[0] : null,
  };

  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <button onClick={() => setScenario('data')}>Show Data</button>
        <button onClick={() => setScenario('loading')}>Show Loading</button>
        <button onClick={() => setScenario('error')}>Show Error</button>
        <button onClick={() => setScenario('empty')}>Show Empty</button>
      </div>
      <RoomDetail {...props} />
    </div>
  );
}

// ================================================
// 4. DYNAMIC LIST WITH ADD/REMOVE
// ================================================

interface WishlistItem {
  id: number;
  text: string;
}

function WishlistEditor() {
  const [items, setItems] = useState<WishlistItem[]>([
    { id: 1, text: 'Wireless headphones' },
    { id: 2, text: 'Warm scarf' },
    { id: 3, text: 'Coffee table book' },
  ]);
  const [newItem, setNewItem] = useState('');
  const [nextId, setNextId] = useState(4);

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newItem.trim()) return;

    setItems(prev => [...prev, { id: nextId, text: newItem.trim() }]);
    setNextId(prev => prev + 1);
    setNewItem('');
  }

  function handleRemove(id: number) {
    setItems(prev => prev.filter(item => item.id !== id));
  }

  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <form onSubmit={handleAdd} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        <input
          type="text"
          value={newItem}
          onChange={e => setNewItem(e.target.value)}
          placeholder="Add a wish..."
          style={{
            flex: 1,
            padding: '0.5rem',
            border: '1px solid #ccc',
            borderRadius: '4px',
            fontSize: '1rem',
          }}
        />
        <button
          type="submit"
          style={{
            background: '#2d5a27',
            color: 'white',
            border: 'none',
            padding: '0.5rem 1rem',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Add
        </button>
      </form>

      {items.length === 0 ? (
        <p style={{ color: '#666', fontStyle: 'italic' }}>
          Your wishlist is empty. Add something!
        </p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {items.map(item => (
            <li
              key={item.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.5rem 0.75rem',
                borderBottom: '1px solid #eee',
              }}
            >
              <span>{item.text}</span>
              <button
                onClick={() => handleRemove(item.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#c0392b',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                }}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      <p style={{ marginTop: '0.5rem', color: '#666', fontSize: '0.85rem' }}>
        {items.length} item{items.length !== 1 ? 's' : ''} in your wishlist
      </p>
    </div>
  );
}

// ================================================
// 5. FILTERED LIST
// ================================================

function FilteredRoomList() {
  const [filter, setFilter] = useState<'all' | 'open' | 'drawn' | 'closed'>('all');

  const filteredRooms = filter === 'all'
    ? sampleRooms
    : sampleRooms.filter(room => room.status === filter);

  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        {(['all', 'open', 'drawn', 'closed'] as const).map(status => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            style={{
              background: filter === status ? '#2d5a27' : '#eee',
              color: filter === status ? 'white' : '#333',
              border: 'none',
              padding: '0.4rem 0.75rem',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {filteredRooms.length === 0 ? (
        <p style={{ color: '#666', fontStyle: 'italic' }}>
          No rooms match the filter "{filter}".
        </p>
      ) : (
        <RoomList rooms={filteredRooms} />
      )}
    </div>
  );
}

// ================================================
// DEMO COMPONENT
// ================================================

function ListsAndConditionalsDemo() {
  return (
    <div style={{ maxWidth: '600px', margin: '2rem auto', fontFamily: 'system-ui, sans-serif' }}>
      <h1>Lists and Conditionals</h1>
      <hr style={{ margin: '1rem 0' }} />

      <h2>1. Basic List Rendering</h2>
      <RoomList rooms={sampleRooms} />
      <hr style={{ margin: '1.5rem 0' }} />

      <h2>2. Conditional Rendering Patterns</h2>
      <ConditionalExamples />
      <hr style={{ margin: '1.5rem 0' }} />

      <h2>3. Early Return Pattern</h2>
      <EarlyReturnDemo />
      <hr style={{ margin: '1.5rem 0' }} />

      <h2>4. Dynamic List (Add/Remove)</h2>
      <WishlistEditor />
      <hr style={{ margin: '1.5rem 0' }} />

      <h2>5. Filtered List</h2>
      <FilteredRoomList />
    </div>
  );
}

export default ListsAndConditionalsDemo;
