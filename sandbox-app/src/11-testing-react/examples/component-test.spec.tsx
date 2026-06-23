// ============================================
// Component Test Example
// ============================================
// Tests a simple Button component: render, click handler, disabled state.
// Demonstrates: render, screen, getByRole, userEvent, vi.fn().

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, test, expect, vi } from 'vitest';

// ---- Component Under Test ----

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary';
}

function Button({ children, onClick, disabled = false, variant = 'primary' }: ButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        backgroundColor: variant === 'primary' ? '#2d5a27' : '#757575',
        color: 'white',
        padding: '8px 16px',
        border: 'none',
        borderRadius: 4,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {children}
    </button>
  );
}

// ---- Tests ----

describe('Button', () => {
  test('renders with text content', () => {
    render(<Button>Click me</Button>);

    // getByRole('button') is the preferred way to find buttons
    const button = screen.getByRole('button', { name: 'Click me' });
    expect(button).toBeInTheDocument();
  });

  test('calls onClick when clicked', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn(); // create a mock function

    render(<Button onClick={handleClick}>Save</Button>);

    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  test('does not call onClick when disabled', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    render(
      <Button onClick={handleClick} disabled>
        Save
      </Button>
    );

    const button = screen.getByRole('button', { name: 'Save' });

    // Verify the button is disabled
    expect(button).toBeDisabled();

    // Click disabled button
    await user.click(button);

    // Handler should NOT have been called
    expect(handleClick).not.toHaveBeenCalled();
  });

  test('supports multiple clicks', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    render(<Button onClick={handleClick}>Count</Button>);

    const button = screen.getByRole('button', { name: 'Count' });

    await user.click(button);
    await user.click(button);
    await user.click(button);

    expect(handleClick).toHaveBeenCalledTimes(3);
  });

  test('renders without onClick (display-only button)', () => {
    render(<Button>Label</Button>);

    // Should not throw even without an onClick handler
    expect(screen.getByRole('button', { name: 'Label' })).toBeInTheDocument();
  });
});
