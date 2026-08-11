import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { REACTIONS } from '@/types/api';
import { ReactionPicker } from './ReactionsPicker';

describe('ReactionPicker', () => {
  it('offers exactly the emoji the server accepts', () => {
    render(<ReactionPicker current={null} outgoing={false} onPick={vi.fn()} />);

    expect(screen.getAllByRole('button')).toHaveLength(REACTIONS.length);

    for (const emoji of REACTIONS) {
      expect(screen.getByLabelText(emoji)).toBeInTheDocument();
    }
  });

  it('picks an emoji when none is set', async () => {
    const onPick = vi.fn();

    render(<ReactionPicker current={null} outgoing onPick={onPick} />);

    await userEvent.click(screen.getByLabelText('🎁'));

    expect(onPick).toHaveBeenCalledWith('🎁');
  });

  it('clears by picking the emoji that is already set', async () => {
    const onPick = vi.fn();

    render(<ReactionPicker current="🎁" outgoing onPick={onPick} />);

    await userEvent.click(screen.getByLabelText('🎁'));

    expect(onPick).toHaveBeenCalledWith(null);
  });

  it('switches straight to a different emoji', async () => {
    const onPick = vi.fn();

    render(<ReactionPicker current="🎁" outgoing onPick={onPick} />);

    await userEvent.click(screen.getByLabelText('❤️'));

    expect(onPick).toHaveBeenCalledWith('❤️');
  });

  it('marks the current emoji as pressed and the others as not', () => {
    render(<ReactionPicker current="😂" outgoing={false} onPick={vi.fn()} />);

    expect(screen.getByLabelText('😂')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByLabelText('🎁')).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  it('every option is a real button, so it is keyboard reachable', () => {
    render(<ReactionPicker current={null} outgoing onPick={vi.fn()} />);

    for (const button of screen.getAllByRole('button')) {
      expect(button).toHaveAttribute('type', 'button');
    }
  });
});
