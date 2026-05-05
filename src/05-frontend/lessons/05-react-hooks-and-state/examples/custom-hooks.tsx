// ============================================
// Custom Hooks Examples
// ============================================
// Three reusable custom hooks: useLocalStorage, useDebounce, useWindowSize.
// Each extracts stateful logic that can be shared across components.

import { useState, useEffect, useCallback } from 'react';

// ---- useLocalStorage ----
// Persists state to localStorage. Reads initial value from storage on mount.

function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(storedValue));
    } catch {
      console.error(`Failed to save "${key}" to localStorage`);
    }
  }, [key, storedValue]);

  return [storedValue, setStoredValue];
}

// ---- useDebounce ----
// Returns a debounced version of a value.
// Useful for search inputs — wait until the user stops typing.

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

// ---- useWindowSize ----
// Tracks the current browser window dimensions.
// Re-renders only when the size actually changes.

interface WindowSize {
  width: number;
  height: number;
}

function useWindowSize(): WindowSize {
  const [size, setSize] = useState<WindowSize>({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const handleResize = () => {
      setSize({ width: window.innerWidth, height: window.innerHeight });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return size;
}

// ---- Demo: useLocalStorage ----

function LocalStorageDemo() {
  const [name, setName] = useLocalStorage('demo-name', '');
  const [count, setCount] = useLocalStorage('demo-count', 0);

  return (
    <div style={{ marginBottom: 24 }}>
      <h3>useLocalStorage</h3>
      <p>These values persist across page reloads. Check localStorage in DevTools.</p>
      <div>
        <label>
          Name:{' '}
          <input value={name} onChange={(e) => setName(e.target.value)} />
        </label>
      </div>
      <div style={{ marginTop: 8 }}>
        <span>Count: {count}</span>{' '}
        <button onClick={() => setCount((c) => c + 1)}>+1</button>
        <button onClick={() => setCount(0)}>Reset</button>
      </div>
    </div>
  );
}

// ---- Demo: useDebounce ----

function DebounceDemo() {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500);
  const [results, setResults] = useState<string[]>([]);

  // Simulate an API call whenever the debounced value changes
  useEffect(() => {
    if (!debouncedSearch) {
      setResults([]);
      return;
    }

    // Fake search results
    const fakeResults = [
      `Result for "${debouncedSearch}" #1`,
      `Result for "${debouncedSearch}" #2`,
      `Result for "${debouncedSearch}" #3`,
    ];
    setResults(fakeResults);
    console.log(`API call with: "${debouncedSearch}"`);
  }, [debouncedSearch]);

  return (
    <div style={{ marginBottom: 24 }}>
      <h3>useDebounce</h3>
      <p>Type quickly — the "API call" only fires 500ms after you stop typing.</p>
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search..."
        style={{ width: 300, padding: 8 }}
      />
      <p style={{ fontSize: 12, color: '#888' }}>
        Input: "{search}" | Debounced: "{debouncedSearch}"
      </p>
      <ul>
        {results.map((r, i) => (
          <li key={i}>{r}</li>
        ))}
      </ul>
    </div>
  );
}

// ---- Demo: useWindowSize ----

function WindowSizeDemo() {
  const { width, height } = useWindowSize();

  const breakpoint = width >= 1024 ? 'Desktop' : width >= 768 ? 'Tablet' : 'Mobile';

  return (
    <div style={{ marginBottom: 24 }}>
      <h3>useWindowSize</h3>
      <p>Resize the browser window to see values update.</p>
      <p>
        {width} x {height} — <strong>{breakpoint}</strong>
      </p>
    </div>
  );
}

// ---- Main App ----

export default function CustomHooksApp() {
  return (
    <div style={{ padding: 20, fontFamily: 'sans-serif' }}>
      <h1>Custom Hooks</h1>
      <LocalStorageDemo />
      <DebounceDemo />
      <WindowSizeDemo />
    </div>
  );
}
