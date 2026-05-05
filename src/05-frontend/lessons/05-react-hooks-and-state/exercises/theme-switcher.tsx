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

import { createContext, useContext, useState, ReactNode } from 'react';

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

// ---- TODO 2: Create the ThemeProvider ----
// - Accept { children: ReactNode } as props
// - Hold theme state (default: 'light') with useState
// - Compute colors from the themes object above
// - Provide { theme, colors, toggleTheme } via context value
// - Return <ThemeContext.Provider value={...}>{children}</ThemeContext.Provider>

// ---- TODO 3: Create the useTheme hook ----
// - Call useContext(ThemeContext)
// - If context is null, throw an Error: 'useTheme must be used within a ThemeProvider'
// - Return the context value

// ---- TODO 4: Create themed Header component ----
// - Use useTheme() to get theme and colors
// - Render a <header> with:
//   - Background: colors.primary
//   - White text
//   - App title "Theme Switcher"
//   - A button that calls toggleTheme (show "Switch to Dark" / "Switch to Light")

function Header() {
  // TODO: Implement
  return <header>Header — implement me</header>;
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
  // TODO: Implement
  return (
    <div>
      <h3>{title}</h3>
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
  // TODO: Implement
  return <button onClick={onClick}>{children}</button>;
}

// ---- Demo App (modify only to wrap with your ThemeProvider) ----

export default function ThemeSwitcherApp() {
  // TODO: Wrap with ThemeProvider
  return (
    <div>
      <Header />
      <div style={{ padding: 20 }}>
        <Card title="Welcome">
          <p>This card should change appearance based on the current theme.</p>
          <Button onClick={() => alert('Clicked!')}>Click Me</Button>
        </Card>
        <Card title="About Themes">
          <p>
            The light theme has a white background and dark text.
            The dark theme has a dark background and light text.
          </p>
          <Button>Another Button</Button>
        </Card>
      </div>
    </div>
  );
}
