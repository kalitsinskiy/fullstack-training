import { useState } from 'react';
import './exercises.css';

function Counter() {
  const [count, setCount] = useState(0);
  const [step, setStep] = useState(1);

  const colorClass = count > 0 ? 'positive' : count < 0 ? 'negative' : 'zero';

  return (
    <div className="exercise-card">
      <div className={`counter-value ${colorClass}`}>{count}</div>
      {count === 0 && <p className="counter-hint">Count is at zero</p>}

      <label className="step-label">
        Step
        <input
          className="step-input"
          type="number"
          value={step}
          onChange={(e) => setStep(Number(e.target.value))}
        />
      </label>

      <div className="btn-row">
        <button className="btn btn-primary" onClick={() => setCount((prev) => prev + step)}>+ Increment</button>
        <button className="btn btn-primary" onClick={() => setCount((prev) => prev - step)}>− Decrement</button>
        <button className="btn btn-ghost" onClick={() => setCount(0)}>Reset</button>
      </div>
    </div>
  );
}

export default Counter;
