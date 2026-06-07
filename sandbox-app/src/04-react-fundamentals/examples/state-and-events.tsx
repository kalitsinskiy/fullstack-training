/**
 * State and Events — Examples
 *
 * Demonstrates useState hook patterns and event handling.
 * To run: copy into a Vite + React + TS project and import in App.tsx
 *
 *   import StateAndEventsDemo from './state-and-events';
 *   function App() { return <StateAndEventsDemo />; }
 */

import { useState } from 'react';

// ================================================
// 1. SIMPLE COUNTER
// ================================================

function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <h3>Counter: {count}</h3>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button onClick={() => setCount(count + 1)}>+1</button>
        <button onClick={() => setCount(count - 1)}>-1</button>
        <button onClick={() => setCount(0)}>Reset</button>
      </div>
    </div>
  );
}

// ================================================
// 2. TOGGLE (boolean state)
// ================================================

function Toggle() {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <h3>Toggle</h3>
      <button onClick={() => setIsVisible(prev => !prev)}>
        {isVisible ? 'Hide' : 'Show'} Content
      </button>
      {isVisible && (
        <div style={{
          marginTop: '0.5rem',
          padding: '1rem',
          background: '#e8f5e9',
          borderRadius: '8px',
        }}>
          This content is toggled on and off with a boolean state.
        </div>
      )}
    </div>
  );
}

// ================================================
// 3. FUNCTIONAL UPDATES
// ================================================

function BatchedUpdates() {
  const [count, setCount] = useState(0);

  function handleTripleIncrement() {
    // Using functional updates ensures all three increments apply.
    // If we wrote setCount(count + 1) three times, only +1 would happen
    // because count is stale within a single render cycle.
    setCount(prev => prev + 1);
    setCount(prev => prev + 1);
    setCount(prev => prev + 1);
  }

  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <h3>Functional Updates: {count}</h3>
      <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
        Clicking "+3" uses three functional updates in a row.
      </p>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button onClick={handleTripleIncrement}>+3 (functional)</button>
        <button onClick={() => setCount(0)}>Reset</button>
      </div>
    </div>
  );
}

// ================================================
// 4. FORM WITH MULTIPLE INPUTS (controlled)
// ================================================

function JoinRoomForm() {
  const [formData, setFormData] = useState({
    displayName: '',
    roomCode: '',
    agreeToRules: false,
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    console.log('Form submitted:', formData);
    alert(`Joining room ${formData.roomCode} as ${formData.displayName}`);
  }

  const inputStyle: React.CSSProperties = {
    display: 'block',
    width: '100%',
    padding: '0.5rem',
    marginTop: '0.25rem',
    marginBottom: '0.75rem',
    border: '1px solid #ccc',
    borderRadius: '4px',
    fontSize: '1rem',
  };

  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <h3>Join a Room (Controlled Form)</h3>
      <form onSubmit={handleSubmit} style={{
        background: '#f9f9f9',
        padding: '1rem',
        borderRadius: '8px',
        maxWidth: '400px',
      }}>
        <label htmlFor="displayName" style={{ fontWeight: 500 }}>
          Display Name
        </label>
        <input
          id="displayName"
          name="displayName"
          type="text"
          value={formData.displayName}
          onChange={handleChange}
          placeholder="Your name"
          required
          style={inputStyle}
        />

        <label htmlFor="roomCode" style={{ fontWeight: 500 }}>
          Room Code
        </label>
        <input
          id="roomCode"
          name="roomCode"
          type="text"
          value={formData.roomCode}
          onChange={handleChange}
          placeholder="e.g. ABC123"
          required
          maxLength={6}
          style={{ ...inputStyle, textTransform: 'uppercase' }}
        />

        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <input
            name="agreeToRules"
            type="checkbox"
            checked={formData.agreeToRules}
            onChange={handleChange}
          />
          I agree to the gift exchange rules
        </label>

        <button
          type="submit"
          disabled={!formData.agreeToRules}
          style={{
            background: formData.agreeToRules ? '#2d5a27' : '#999',
            color: 'white',
            padding: '0.5rem 1.25rem',
            border: 'none',
            borderRadius: '4px',
            cursor: formData.agreeToRules ? 'pointer' : 'not-allowed',
            fontSize: '1rem',
          }}
        >
          Join Room
        </button>
      </form>

      {/* Live preview of form state */}
      <pre style={{
        marginTop: '0.75rem',
        background: '#f0f0f0',
        padding: '0.75rem',
        borderRadius: '4px',
        fontSize: '0.85rem',
        maxWidth: '400px',
      }}>
        {JSON.stringify(formData, null, 2)}
      </pre>
    </div>
  );
}

// ================================================
// 5. OBJECT STATE (user profile)
// ================================================

interface UserProfile {
  name: string;
  email: string;
  bio: string;
}

function ProfileEditor() {
  const [profile, setProfile] = useState<UserProfile>({
    name: '',
    email: '',
    bio: '',
  });
  const [saved, setSaved] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    // Spread the previous state and update only the changed field
    setProfile(prev => ({ ...prev, [name]: value }));
    setSaved(false);
  }

  function handleSave() {
    console.log('Saving profile:', profile);
    setSaved(true);
  }

  const inputStyle: React.CSSProperties = {
    display: 'block',
    width: '100%',
    padding: '0.5rem',
    marginTop: '0.25rem',
    marginBottom: '0.75rem',
    border: '1px solid #ccc',
    borderRadius: '4px',
    fontSize: '1rem',
  };

  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <h3>Profile Editor (Object State)</h3>
      <div style={{ maxWidth: '400px' }}>
        <label style={{ fontWeight: 500 }}>Name</label>
        <input name="name" value={profile.name} onChange={handleChange} style={inputStyle} />

        <label style={{ fontWeight: 500 }}>Email</label>
        <input name="email" type="email" value={profile.email} onChange={handleChange} style={inputStyle} />

        <label style={{ fontWeight: 500 }}>Bio</label>
        <textarea
          name="bio"
          value={profile.bio}
          onChange={handleChange}
          rows={3}
          style={{ ...inputStyle, resize: 'vertical' }}
        />

        <button
          onClick={handleSave}
          style={{
            background: '#2d5a27',
            color: 'white',
            padding: '0.5rem 1.25rem',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Save Profile
        </button>
        {saved && <span style={{ marginLeft: '0.5rem', color: '#27ae60' }}>Saved!</span>}
      </div>
    </div>
  );
}

// ================================================
// DEMO COMPONENT
// ================================================

function StateAndEventsDemo() {
  return (
    <div style={{ maxWidth: '600px', margin: '2rem auto', fontFamily: 'system-ui, sans-serif' }}>
      <h1>State and Events</h1>
      <hr style={{ margin: '1rem 0' }} />

      <h2>1. Simple Counter</h2>
      <Counter />

      <h2>2. Toggle (Boolean State)</h2>
      <Toggle />

      <h2>3. Functional Updates</h2>
      <BatchedUpdates />

      <h2>4. Controlled Form</h2>
      <JoinRoomForm />

      <h2>5. Object State</h2>
      <ProfileEditor />
    </div>
  );
}

export default StateAndEventsDemo;
