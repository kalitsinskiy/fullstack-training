/**
 * Exercise: Counter Component
 *
 * TODO: Build a counter with increment, decrement, and reset functionality.
 *
 * Requirements:
 *
 * 1. IMPORT useState from 'react'
 *
 * 2. CREATE A Counter COMPONENT that:
 *    - Uses useState to track the current count (initial value: 0)
 *    - Displays the current count in a heading or paragraph
 *    - Has three buttons:
 *      a) "Increment" — adds 1 to the count
 *      b) "Decrement" — subtracts 1 from the count
 *      c) "Reset" — sets the count back to 0
 *
 * 3. ADD A STEP INPUT:
 *    - Add a number input that lets the user choose a step value (default: 1)
 *    - Use a separate useState for the step
 *    - Increment/Decrement should add/subtract the step value, not just 1
 *    - Display the current step value
 *
 * 4. CONDITIONAL DISPLAY:
 *    - If the count is positive, show it in green
 *    - If the count is negative, show it in red
 *    - If the count is zero, show it in gray
 *    - Show a message "Count is at zero" only when count === 0
 *
 * 5. USE FUNCTIONAL UPDATES:
 *    - Use the functional form of setState: setCount(prev => prev + step)
 *    - This is a best practice when new state depends on previous state
 *
 * 6. EXPORT the Counter component as default
 *
 * Hints:
 * - Look at examples/state-and-events.tsx for useState patterns
 * - For the color, use a ternary or a helper function:
 *     const color = count > 0 ? 'green' : count < 0 ? 'red' : 'gray';
 * - The step input should be a controlled component (value + onChange)
 * - Remember: onChange on an input gives you e.target.value as a string,
 *   so use Number(e.target.value) or parseInt() to convert
 *
 * To test: copy this file into your Vite + React + TS project (e.g., src/exercises/counter.tsx)
 * and import it in App.tsx:
 *
 *   import Counter from './exercises/counter';
 *   function App() { return <Counter />; }
 */

// TODO: import useState
import { useState } from 'react';
// TODO: create the Counter component

function Counter() {
  const [count, setCount] = useState(0);
  const [step, setStep] = useState(1);

  const buttonStyle: React.CSSProperties = {
    border: '1px solid #ccc',
    margin: '0.5rem',
    padding: '0 0.5rem',
    minWidth: '60px',
    cursor: 'pointer',
  };
  const inputStyle: React.CSSProperties = {
    width: '60px',
    padding: '0.25rem',
    marginLeft: '0.5rem',
  };

  const color = count > 0 ? 'green' : count < 0 ? 'red' : 'gray';

  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <h3 style={{ color }}>Counter: {count}</h3>
      <p style={{ color }}>{count === 0 && 'Count is at zero'}</p>
      <div style={{ marginBottom: '0.5rem' }}>
        <label>
          Step:
          <input
            type="number"
            value={step}
            onChange={(e) => setStep(Number(e.target.value))}
            style={inputStyle}
          />
        </label>
      </div>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button style={buttonStyle} onClick={() => setCount((prev) => prev + step)}>
          +{step}
        </button>
        <button style={buttonStyle} onClick={() => setCount((prev) => prev - step)}>
          -{step}
        </button>
        <button style={buttonStyle} onClick={() => setCount(0)}>
          Reset
        </button>
      </div>
    </div>
  );
}

// TODO: export default Counter
export default Counter;
