// ============================================
// Exercise: Theme Switcher with Context
// ============================================
//
// Build a theme system using React Context:
// 1. Create a ThemeContext with createContext
// 2. Create a ThemeProvider component that holds the theme state
// 3. Create a useTheme custom hook (with error if used outside provider)
// 4. Create 3 themed components: Header, Card, Button
// 5. Support "light" and "dark" themes
//
// The demo app at the bottom wires everything together.

import React, { createContext, useContext, useState, ReactNode } from 'react';

// ---- Types ----

type Theme = 'light' | 'dark';

interface ThemeColors {
  background: string;
  text: string;
  primary: string;
  cardBackground: string;
  border: string;
}

interface ThemeContextType {
  theme: Theme;
  colors: ThemeColors;
  toggleTheme: () => void;
}

// ---- Theme definitions (use these in your provider) ----

const themes: Record<Theme, ThemeColors> = {
  light: {
    background: '#f5f5f5',
    text: '#1a1a1a',
    primary: '#1976d2',
    cardBackground: '#ffffff',
    border: '#e0e0e0',
  },
  dark: {
    background: '#121212',
    text: '#e0e0e0',
    primary: '#90caf9',
    cardBackground: '#1e1e1e',
    border: '#333333',
  },
};

// ---- TODO 1: Create the ThemeContext ----
// Use createContext with a default value of null.
// Type it as ThemeContextType | null.
const ThemeContext = createContext<ThemeContextType | null>(null);

// ---- TODO 2: Create the ThemeProvider ----
// - Accept { children: ReactNode } as props
// - Hold theme state (default: 'light') with useState
// - Compute colors from the themes object above
// - Provide { theme, colors, toggleTheme } via context value
// - Return <ThemeContext.Provider value={...}>{children}</ThemeContext.Provider>
function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');
  const colors = themes[theme];
  const toggleTheme = () => setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  return (
    <ThemeContext.Provider value={{ theme, colors, toggleTheme }}>{children}</ThemeContext.Provider>
  );
}

// ---- TODO 3: Create the useTheme hook ----
// - Call useContext(ThemeContext)
// - If context is null, throw an Error: 'useTheme must be used within a ThemeProvider'
// - Return the context value
function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (context === null) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
}

// ---- TODO 4: Create themed Header component ----
// - Use useTheme() to get theme and colors
// - Render a <header> with:
//   - Background: colors.primary
//   - White text
//   - App title "Theme Switcher"
//   - A button that calls toggleTheme (show "Switch to Dark" / "Switch to Light")

function Header() {
  const { theme, colors, toggleTheme } = useTheme();
  return (
    <header
      style={{
        background: colors.primary,
        color: '#fff',
        padding: '1rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <span style={{ fontWeight: 600, fontSize: '1.1rem' }}>Theme Switcher</span>
      <button
        onClick={toggleTheme}
        style={{
          background: 'rgba(255,255,255,0.2)',
          color: '#fff',
          border: '1px solid rgba(255,255,255,0.5)',
          borderRadius: '4px',
          padding: '0.25rem 0.75rem',
          cursor: 'pointer',
        }}
      >
        {theme === 'light' ? 'Switch to Dark' : 'Switch to Light'}
      </button>
    </header>
  );
}

// ---- TODO 5: Create themed Card component ----
// - Props: { title: string; children: ReactNode }
// - Use useTheme() to get colors
// - Render a <div> with:
//   - Background: colors.cardBackground
//   - Text color: colors.text
//   - Border: 1px solid colors.border
//   - Border radius, padding
//   - Title in <h3>, children below

function Card({ title, children }: { title: string; children: ReactNode }) {
  const { colors } = useTheme();
  return (
    <div
      style={{
        background: colors.cardBackground,
        color: colors.text,
        border: `1px solid ${colors.border}`,
        borderRadius: '8px',
        padding: '1.25rem',
        marginBottom: '1rem',
      }}
    >
      <h3 style={{ marginBottom: '0.5rem' }}>{title}</h3>
      {children}
    </div>
  );
}

// ---- TODO 6: Create themed Button component ----
// - Props: { children: ReactNode; onClick?: () => void }
// - Use useTheme() to get colors
// - Render a <button> with:
//   - Background: colors.primary
//   - White text
//   - Rounded corners, padding
//   - onClick handler

function Button({ children, onClick }: { children: ReactNode; onClick?: () => void }) {
  const { colors } = useTheme();
  return (
    <button
      onClick={onClick}
      style={{
        background: colors.primary,
        color: '#fff',
        border: 'none',
        borderRadius: '4px',
        padding: '0.4rem 1rem',
        cursor: 'pointer',
        marginTop: '0.5rem',
      }}
    >
      {children}
    </button>
  );
}

// ---- Demo App (modify only to wrap with your ThemeProvider) ----

export default function ThemeSwitcherApp() {
  // TODO: Wrap with ThemeProvider
  return (
    <ThemeProvider>
      <div>
        <Header />
        <div style={{ padding: 20 }}>
          <Card title="Welcome">
            <p>This card should change appearance based on the current theme.</p>
            <Button onClick={() => alert('Clicked!')}>Click Me</Button>
          </Card>
          <Card title="About Themes">
            <p>
              The light theme has a white background and dark text. The dark theme has a dark
              background and light text.
            </p>
            <Button>Another Button</Button>
          </Card>
        </div>
      </div>
    </ThemeProvider>
  );
}
