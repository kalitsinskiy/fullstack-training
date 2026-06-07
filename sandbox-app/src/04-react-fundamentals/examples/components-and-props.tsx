/**
 * Components and Props — Examples
 *
 * To run: copy into a Vite + React + TS project and import in App.tsx
 *
 *   import ComponentsDemo from './components-and-props';
 *   function App() { return <ComponentsDemo />; }
 */

// ================================================
// 1. BASIC COMPONENT
// ================================================

function Greeting() {
  return <h2>Hello, Secret Santa!</h2>;
}

// ================================================
// 2. COMPONENT WITH PROPS
// ================================================

interface WelcomeProps {
  name: string;
  role?: string;
}

function Welcome({ name, role = 'participant' }: WelcomeProps) {
  return (
    <div style={{ marginBottom: '0.5rem' }}>
      <strong>{name}</strong> — {role}
    </div>
  );
}

// ================================================
// 3. COMPONENT WITH CHILDREN
// ================================================

interface CardProps {
  title: string;
  children: React.ReactNode;
}

function Card({ title, children }: CardProps) {
  return (
    <div style={{
      border: '1px solid #ddd',
      borderRadius: '8px',
      padding: '1rem',
      marginBottom: '1rem',
    }}>
      <h3 style={{ marginBottom: '0.5rem', color: '#2d5a27' }}>{title}</h3>
      {children}
    </div>
  );
}

// ================================================
// 4. COMPONENT COMPOSITION
// ================================================

interface RoomHeaderProps {
  roomName: string;
  participantCount: number;
}

function RoomHeader({ roomName, participantCount }: RoomHeaderProps) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <h3>{roomName}</h3>
      <span style={{
        background: '#e8f5e9',
        color: '#2d5a27',
        padding: '0.2rem 0.6rem',
        borderRadius: '12px',
        fontSize: '0.85rem',
      }}>
        {participantCount} participants
      </span>
    </div>
  );
}

interface BadgeProps {
  status: 'open' | 'drawn' | 'closed';
}

function StatusBadge({ status }: BadgeProps) {
  const colors: Record<string, string> = {
    open: '#27ae60',
    drawn: '#2980b9',
    closed: '#7f8c8d',
  };

  return (
    <span style={{
      display: 'inline-block',
      padding: '0.15rem 0.5rem',
      borderRadius: '12px',
      fontSize: '0.8rem',
      fontWeight: 'bold',
      color: 'white',
      background: colors[status],
    }}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

// ================================================
// 5. DEFAULT PROPS AND OPTIONAL PROPS
// ================================================

interface ButtonProps {
  label: string;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  onClick?: () => void;
}

function Button({ label, variant = 'primary', disabled = false, onClick }: ButtonProps) {
  const colors: Record<string, string> = {
    primary: '#2d5a27',
    secondary: '#6c757d',
    danger: '#c0392b',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        background: colors[variant],
        color: 'white',
        padding: '0.5rem 1rem',
        border: 'none',
        borderRadius: '4px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        marginRight: '0.5rem',
      }}
    >
      {label}
    </button>
  );
}

// ================================================
// DEMO
// ================================================

function ComponentsDemo() {
  return (
    <div style={{ maxWidth: '600px', margin: '2rem auto', fontFamily: 'system-ui, sans-serif' }}>
      <h1>Components and Props</h1>

      {/* 1. Basic component */}
      <Greeting />
      <hr style={{ margin: '1rem 0' }} />

      {/* 2. Props */}
      <h2>Welcome Messages</h2>
      <Welcome name="Alice" role="admin" />
      <Welcome name="Bob" role="organizer" />
      <Welcome name="Charlie" />  {/* uses default role */}
      <hr style={{ margin: '1rem 0' }} />

      {/* 3. Children */}
      <h2>Cards with Children</h2>
      <Card title="Engineering Team">
        <p>12 participants &middot; Budget: $25</p>
        <StatusBadge status="open" />
      </Card>
      <Card title="Family Holiday">
        <p>8 participants &middot; Budget: $50</p>
        <StatusBadge status="drawn" />
      </Card>
      <hr style={{ margin: '1rem 0' }} />

      {/* 4. Composition */}
      <h2>Component Composition</h2>
      <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '1rem' }}>
        <RoomHeader roomName="Book Club Swap" participantCount={6} />
        <p style={{ margin: '0.5rem 0', color: '#666' }}>Budget: $15</p>
        <StatusBadge status="closed" />
      </div>
      <hr style={{ margin: '1rem 0' }} />

      {/* 5. Default/optional props */}
      <h2>Buttons</h2>
      <Button label="Join Room" onClick={() => console.log('Joined!')} />
      <Button label="Leave" variant="secondary" onClick={() => console.log('Left!')} />
      <Button label="Delete" variant="danger" onClick={() => console.log('Deleted!')} />
      <Button label="Disabled" disabled />
    </div>
  );
}

export default ComponentsDemo;
