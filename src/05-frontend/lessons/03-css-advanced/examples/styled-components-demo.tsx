/**
 * Styled Components Demo
 *
 * This file demonstrates Styled Components patterns.
 * To run: install styled-components in a Vite + React + TS project and import this component.
 *
 *   npm install styled-components
 *   npm install -D @types/styled-components
 */

import styled, { ThemeProvider, css } from 'styled-components';

// ================================================
// 1. BASIC STYLED COMPONENT
// ================================================

const Card = styled.article`
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 1.25rem;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
  transition: box-shadow 0.2s ease, transform 0.2s ease;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    transform: translateY(-2px);
  }
`;

// ================================================
// 2. PROPS-BASED STYLING
// ================================================

interface ButtonProps {
  $variant?: 'primary' | 'secondary' | 'danger';
  $size?: 'sm' | 'md' | 'lg';
  $fullWidth?: boolean;
}

const variantStyles = {
  primary: css`
    background: #2d5a27;
    color: white;
    &:hover { background: #1e3d1a; }
  `,
  secondary: css`
    background: #6c757d;
    color: white;
    &:hover { background: #5a6268; }
  `,
  danger: css`
    background: #c0392b;
    color: white;
    &:hover { background: #a93226; }
  `,
};

const sizeStyles = {
  sm: css`
    padding: 0.25rem 0.75rem;
    font-size: 0.875rem;
  `,
  md: css`
    padding: 0.5rem 1.25rem;
    font-size: 1rem;
  `,
  lg: css`
    padding: 0.75rem 2rem;
    font-size: 1.125rem;
  `,
};

const Button = styled.button<ButtonProps>`
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s, opacity 0.2s;
  width: ${({ $fullWidth }) => ($fullWidth ? '100%' : 'auto')};

  ${({ $variant = 'primary' }) => variantStyles[$variant]}
  ${({ $size = 'md' }) => sizeStyles[$size]}

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

// ================================================
// 3. EXTENDING STYLES
// ================================================

const OutlineButton = styled(Button)`
  background: transparent;
  border: 2px solid #2d5a27;
  color: #2d5a27;

  &:hover {
    background: #2d5a27;
    color: white;
  }
`;

// ================================================
// 4. THEMING
// ================================================

const theme = {
  colors: {
    primary: '#2d5a27',
    primaryDark: '#1e3d1a',
    danger: '#c0392b',
    text: '#333',
    textMuted: '#666',
    bg: '#ffffff',
    surface: '#f5f5f5',
    border: '#dddddd',
  },
  spacing: {
    sm: '0.5rem',
    md: '1rem',
    lg: '2rem',
  },
  radius: '8px',
};

// Components using theme
const ThemedCard = styled.article`
  background: ${({ theme }) => theme.colors.bg};
  color: ${({ theme }) => theme.colors.text};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius};
  padding: ${({ theme }) => theme.spacing.md};
`;

// ================================================
// 5. BADGE WITH CONDITIONAL STYLING
// ================================================

interface BadgeProps {
  $status: 'open' | 'drawn' | 'closed';
}

const badgeColors = {
  open: '#27ae60',
  drawn: '#2980b9',
  closed: '#7f8c8d',
};

const Badge = styled.span<BadgeProps>`
  display: inline-block;
  padding: 0.2rem 0.6rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  color: white;
  background: ${({ $status }) => badgeColors[$status]};
`;

// ================================================
// DEMO COMPONENT
// ================================================

function StyledComponentsDemo() {
  return (
    <ThemeProvider theme={theme}>
      <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
        <h1>Styled Components Demo</h1>

        {/* Basic card */}
        <Card style={{ marginBottom: '1rem' }}>
          <h3>Engineering Team</h3>
          <p>12 participants</p>
          <Badge $status="open">Open</Badge>
        </Card>

        {/* Buttons with variants and sizes */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
          <Button $variant="primary" $size="sm">Primary SM</Button>
          <Button $variant="primary" $size="md">Primary MD</Button>
          <Button $variant="primary" $size="lg">Primary LG</Button>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
          <Button $variant="secondary">Secondary</Button>
          <Button $variant="danger">Danger</Button>
          <Button $variant="primary" disabled>Disabled</Button>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <Button $variant="primary" $fullWidth>Full Width Button</Button>
        </div>

        {/* Outline button (extended) */}
        <OutlineButton $size="md" style={{ marginBottom: '1rem' }}>
          Outline Button
        </OutlineButton>

        {/* Themed card */}
        <ThemedCard>
          <h3>Themed Card</h3>
          <p>This card uses theme values from ThemeProvider.</p>
        </ThemedCard>
      </div>
    </ThemeProvider>
  );
}

export default StyledComponentsDemo;
