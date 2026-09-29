import { describe, expect, it } from 'vitest';
import {
  createTttState,
  tttApplyMove,
  tttEvaluate,
  tttLegalMoves,
} from './tictactoe';
import type { TttState } from './tictactoe';

function play(state: TttState, moves: number[]): TttState {
  return moves.reduce((current, move, index) => tttApplyMove(current, move, index % 2 === 0 ? 'p1' : 'p2'), state);
}

describe('tictactoe rules', () => {
  it('starts empty with nine legal moves', () => {
    const state = createTttState();
    expect(state).toHaveLength(9);
    expect(tttLegalMoves(state)).toHaveLength(9);
    expect(tttEvaluate(state)).toEqual({ status: 'playing' });
  });

  it('rejects moves on occupied cells', () => {
    const state = tttApplyMove(createTttState(), 4, 'p1');
    expect(tttLegalMoves(state)).not.toContain(4);
    expect(tttApplyMove(state, 4, 'p2')).toBe(state);
  });

  it('detects a row win and reports the winning cells', () => {
    const state = play(createTttState(), [0, 3, 1, 4, 2]);
    const result = tttEvaluate(state);
    expect(result.status).toBe('won');
    if (result.status === 'won') {
      expect(result.winner).toBe('p1');
      expect(result.highlight).toEqual([0, 1, 2]);
    }
  });

  it('detects a diagonal win for the second player', () => {
    const state = play(createTttState(), [0, 2, 1, 4, 5, 6]);
    const result = tttEvaluate(state);
    expect(result.status).toBe('won');
    if (result.status === 'won') {
      expect(result.winner).toBe('p2');
      expect(result.highlight).toEqual([2, 4, 6]);
    }
  });

  it('detects a full board draw', () => {
    const state = play(createTttState(), [0, 1, 2, 4, 3, 5, 7, 6, 8]);
    expect(tttEvaluate(state)).toEqual({ status: 'draw' });
  });
});
