import { describe, test, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { useTheme } from './useTheme';

describe('useTheme', () => {
  test('swaps the theme, the <body> class and localStorage', () => {
    const { result } = renderHook(() => useTheme(), { wrapper: ThemeProvider });

    expect(result.current.theme).toBe('light');
    expect(document.body.classList.contains('light')).toBe(true);

    act(() => result.current.toggle());

    expect(result.current.theme).toBe('dark');
    expect(document.body.classList.contains('dark')).toBe(true);
    expect(document.body.classList.contains('light')).toBe(false);
    expect(localStorage.getItem('theme')).toBe('dark');
  });

  test('throws when used outside ThemeProvider', () => {
    expect(() => renderHook(() => useTheme())).toThrow(/within ThemeProvider/i);
  });
});
