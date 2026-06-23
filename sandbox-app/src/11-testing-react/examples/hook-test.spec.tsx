// ============================================
// Hook Test Example
// ============================================
// Tests custom hooks using renderHook and act.
// Demonstrates: renderHook, act, testing state changes, testing with initial values.

import { renderHook, act } from '@testing-library/react';
import { describe, test, expect } from 'vitest';
import { useState, useCallback } from 'react';

// ---- Hooks Under Test ----

// Simple counter hook
function useCounter(initialValue = 0) {
  const [count, setCount] = useState(initialValue);

  const increment = useCallback(() => setCount((c) => c + 1), []);
  const decrement = useCallback(() => setCount((c) => c - 1), []);
  const reset = useCallback(() => setCount(initialValue), [initialValue]);

  return { count, increment, decrement, reset };
}

// Toggle hook
function useToggle(initialValue = false) {
  const [value, setValue] = useState(initialValue);

  const toggle = useCallback(() => setValue((v) => !v), []);
  const setTrue = useCallback(() => setValue(true), []);
  const setFalse = useCallback(() => setValue(false), []);

  return { value, toggle, setTrue, setFalse };
}

// ---- Tests ----

describe('useCounter', () => {
  test('starts with initial value', () => {
    const { result } = renderHook(() => useCounter(10));

    expect(result.current.count).toBe(10);
  });

  test('defaults to 0', () => {
    const { result } = renderHook(() => useCounter());

    expect(result.current.count).toBe(0);
  });

  test('increments the count', () => {
    const { result } = renderHook(() => useCounter(0));

    // act() wraps state updates — required because useState triggers a re-render
    act(() => {
      result.current.increment();
    });

    expect(result.current.count).toBe(1);
  });

  test('decrements the count', () => {
    const { result } = renderHook(() => useCounter(5));

    act(() => {
      result.current.decrement();
    });

    expect(result.current.count).toBe(4);
  });

  test('resets to initial value', () => {
    const { result } = renderHook(() => useCounter(10));

    act(() => {
      result.current.increment();
      result.current.increment();
      result.current.increment();
    });

    expect(result.current.count).toBe(13);

    act(() => {
      result.current.reset();
    });

    expect(result.current.count).toBe(10);
  });

  test('handles multiple operations', () => {
    const { result } = renderHook(() => useCounter(0));

    act(() => {
      result.current.increment();
      result.current.increment();
      result.current.decrement();
    });

    expect(result.current.count).toBe(1);
  });
});

describe('useToggle', () => {
  test('starts with initial value', () => {
    const { result } = renderHook(() => useToggle(true));
    expect(result.current.value).toBe(true);
  });

  test('defaults to false', () => {
    const { result } = renderHook(() => useToggle());
    expect(result.current.value).toBe(false);
  });

  test('toggles the value', () => {
    const { result } = renderHook(() => useToggle(false));

    act(() => { result.current.toggle(); });
    expect(result.current.value).toBe(true);

    act(() => { result.current.toggle(); });
    expect(result.current.value).toBe(false);
  });

  test('setTrue always sets to true', () => {
    const { result } = renderHook(() => useToggle(false));

    act(() => { result.current.setTrue(); });
    expect(result.current.value).toBe(true);

    // Calling setTrue again should still be true
    act(() => { result.current.setTrue(); });
    expect(result.current.value).toBe(true);
  });

  test('setFalse always sets to false', () => {
    const { result } = renderHook(() => useToggle(true));

    act(() => { result.current.setFalse(); });
    expect(result.current.value).toBe(false);
  });
});
