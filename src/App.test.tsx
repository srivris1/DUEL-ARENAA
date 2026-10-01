import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

describe('App', () => {
  it('renders the lobby with the three games', () => {
    window.location.hash = '#/';
    render(<App />);
    expect(screen.getByRole('heading', { name: /Duel Arena/i })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /Tic-Tac-Toe/i })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /Connect Four/i })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /Rock Paper Scissors/i })).toBeInTheDocument();
  });

  it('opens a local match and records moves', async () => {
    const user = userEvent.setup();
    window.location.hash = '#/';
    render(<App />);
    await user.click(screen.getByRole('button', { name: /Pass & play/i }));

    const board = await screen.findByRole('grid', { name: /Tic tac toe board/i });
    expect(board).toBeInTheDocument();

    const centre = screen.getByRole('gridcell', { name: /row 2, column 2: empty/i });
    await user.click(centre);
    expect(
      await screen.findByRole('gridcell', { name: /row 2, column 2: p1/i }),
    ).toBeInTheDocument();
  });

  it('navigates to room on entering join code', async () => {
    const user = userEvent.setup();
    window.location.hash = '#/';
    render(<App />);
    const joinInput = screen.getByLabelText(/Join room code/i);
    await user.type(joinInput, 'TESTX');
    const joinBtn = screen.getByRole('button', { name: /Join/i });
    await user.click(joinBtn);
    expect(window.location.hash).toBe('#/join/TESTX');
  });
});
