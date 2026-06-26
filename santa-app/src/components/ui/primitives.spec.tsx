import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FormError } from './FormError';
import { StatusMessage } from './StatusMessage/StatusMessage';
import { Heading } from './Heading';
import { Muted } from './Muted';
import { AuthCard } from '../AuthCard';

describe('FormError', () => {
  test('renders an alert with the message', () => {
    render(<FormError>Something broke</FormError>);
    expect(screen.getByRole('alert')).toHaveTextContent('Something broke');
  });

  test('renders nothing when there is no message', () => {
    const { container } = render(<FormError>{undefined}</FormError>);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(container).toBeEmptyDOMElement();
  });
});

describe('StatusMessage', () => {
  test('error variant is an alert', () => {
    render(<StatusMessage variant="error">Boom</StatusMessage>);
    expect(screen.getByRole('alert')).toHaveTextContent('Boom');
  });

  test('default (muted) variant is not an alert', () => {
    render(<StatusMessage>Loading…</StatusMessage>);
    expect(screen.getByText('Loading…')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});

describe('Heading', () => {
  test('level="page" renders an h1', () => {
    render(<Heading level="page">Rooms</Heading>);
    expect(screen.getByRole('heading', { level: 1, name: 'Rooms' })).toBeInTheDocument();
  });

  test('default level renders an h2', () => {
    render(<Heading>Section</Heading>);
    expect(screen.getByRole('heading', { level: 2, name: 'Section' })).toBeInTheDocument();
  });
});

describe('Muted', () => {
  test('renders its text', () => {
    render(<Muted>meta info</Muted>);
    expect(screen.getByText('meta info')).toBeInTheDocument();
  });
});

describe('AuthCard', () => {
  test('renders the title, the brand pill, and children', () => {
    render(
      <AuthCard title="Welcome Back">
        <button type="submit">Sign In</button>
      </AuthCard>
    );
    expect(screen.getByRole('heading', { name: 'Welcome Back' })).toBeInTheDocument();
    expect(screen.getByText(/Secret Santa/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument();
  });
});
