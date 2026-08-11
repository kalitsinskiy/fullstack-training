import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ReactionList } from './ReactionList';

describe('ReactionList', () => {
  it('renders nothing when there are no reactions', () => {
    const { container } = render(<ReactionList mine={null} theirs={null} />);

    expect(container).toBeEmptyDOMElement();
  });

  it('shows my reaction', () => {
    render(<ReactionList mine="🎁" theirs={null} />);

    expect(screen.getByLabelText('You reacted 🎁')).toBeInTheDocument();
    expect(screen.queryByLabelText(/They reacted/)).not.toBeInTheDocument();
  });

  it('shows the counterparty reaction without naming them', () => {
    render(<ReactionList mine={null} theirs="😂" />);

    expect(screen.getByLabelText('They reacted 😂')).toBeInTheDocument();
  });

  it('shows both, and never a count', () => {
    render(<ReactionList mine="👍" theirs="👎" />);

    expect(screen.getByLabelText('You reacted 👍')).toBeInTheDocument();
    expect(screen.getByLabelText('They reacted 👎')).toBeInTheDocument();
    expect(screen.queryByText('2')).not.toBeInTheDocument();
  });

  it('exposes no user id or display name in the markup', () => {
    const { container } = render(<ReactionList mine="🎉" theirs="❤️" />);

    expect(container.innerHTML).not.toMatch(/[0-9a-f]{24}/i);
    expect(container.textContent).toBe('❤️🎉');
  });
});
