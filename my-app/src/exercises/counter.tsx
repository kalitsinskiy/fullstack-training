import { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);
  const [step, setStep] = useState(1);

  const color = count > 0 ? 'green' : count < 0 ? 'red' : 'gray';

  return (
    <div>
      <p style={{ color, fontSize: '2rem', fontWeight: 'bold' }}>{count}</p>
      {count === 0 && <p>Count is at zero</p>}

      <div>
        <label>
          Step:
          <input
            type="number"
            value={step}
            onChange={(e) => setStep(Number(e.target.value))}
          />
        </label>
        <p>Current step: {step}</p>
      </div>

      <div>
        <button onClick={() => setCount((prev) => prev + step)}>Increment</button>
        <button onClick={() => setCount((prev) => prev - step)}>Decrement</button>
        <button onClick={() => setCount(0)}>Reset</button>
      </div>
    </div>
  );
}

export default Counter;
