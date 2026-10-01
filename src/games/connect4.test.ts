import { describe, expect, it } from 'vitest';
import {
  C4_COLS,
  C4_ROWS,
  c4ApplyMove,
  c4Evaluate,
  c4LegalMoves,
  c4Height,
  cellIndex,
  createC4State,
} from './connect4';
import type { C4State } from './connect4';
import type { Seat } from './types';

function drop(state: C4State, column: number, seat: Seat): C4State {
  return c4ApplyMove(state, column, seat);
}

describe('connect4 rules', () => {
  it('starts with seven legal columns', () => {
    expect(c4LegalMoves(createC4State())).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });

  it('stacks discs at the bottom of the column', () => {
    let state = drop(createC4State(), 3, 'p1');
    state = drop(state, 3, 'p2');
    expect(state[cellIndex(3, 0)]).toBe('p1');
    expect(state[cellIndex(3, 1)]).toBe('p2');
    expect(state[cellIndex(3, 2)]).toBeNull();
    expect(c4Height(state, 3)).toBe(2);
  });

  it('refuses drops into a full or invalid column', () => {
    let state = createC4State();
    for (let index = 0; index < C4_ROWS; index += 1) {
      state = drop(state, 0, index % 2 === 0 ? 'p1' : 'p2');
    }
    expect(c4LegalMoves(state)).not.toContain(0);
    expect(drop(state, 99, 'p1')).toBe(state);
  });

  it('detects a horizontal win', () => {
    let state = createC4State();
    state = drop(state, 0, 'p1');
    state = drop(state, 5, 'p2');
    state = drop(state, 1, 'p1');
    state = drop(state, 6, 'p2');
    state = drop(state, 2, 'p1');
    state = drop(state, 0, 'p2');
    state = drop(state, 3, 'p1');
    const result = c4Evaluate(state);
    expect(result.status).toBe('won');
    if (result.status === 'won') {
      expect(result.winner).toBe('p1');
      expect(result.highlight).toHaveLength(4);
    }
  });

  it('detects a vertical win', () => {
    let state = createC4State();
    for (let index = 0; index < 4; index += 1) {
      state = drop(state, 2, 'p1');
    }
    const result = c4Evaluate(state);
    expect(result.status).toBe('won');
    if (result.status === 'won') expect(result.highlight).toHaveLength(4);
  });

  it('detects a diagonal win', () => {
    let state = createC4State();
    state = drop(drop(state, 0, 'p1'), 0, 'p2');
    state = drop(drop(state, 1, 'p1'), 1, 'p2');
    state = drop(drop(state, 2, 'p1'), 2, 'p2');
    state = drop(drop(state, 3, 'p1'), 3, 'p2');
    const result = c4Evaluate(state);
    expect(result.status).toBe('won');
    if (result.status === 'won') expect(result.highlight).toHaveLength(4);
  });

  it('always finds a line on a full board, so games cannot end level', () => {
    const board: C4State = Array.from({ length: C4_COLS * C4_ROWS }, (_value, index) => {
      const column = Math.floor(index / C4_ROWS);
      const row = index % C4_ROWS;
      return (row + column) % 2 === 0 ? 'p1' : 'p2';
    });
    expect(c4Evaluate(board).status).toBe('won');
  });
});
