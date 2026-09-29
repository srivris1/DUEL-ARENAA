import type { GameAdapter, RoundResult, Seat } from './types';

export const C4_ROWS = 6;
export const C4_COLS = 7;

export type C4Cell = Seat | null;
export type C4State = readonly C4Cell[];

export function cellIndex(column: number, row: number): number {
  return column * C4_ROWS + row;
}

export function createC4State(): C4State {
  return Array<C4Cell>(C4_COLS * C4_ROWS).fill(null);
}

export function c4ColumnOf(index: number): number {
  return Math.floor(index / C4_ROWS);
}

export function c4Height(state: C4State, column: number): number {
  let height = 0;
  for (let row = 0; row < C4_ROWS; row += 1) {
    if (state[cellIndex(column, row)] === null) break;
    height += 1;
  }
  return height;
}

export function c4CanDrop(state: C4State, column: number): boolean {
  if (column < 0 || column >= C4_COLS) return false;
  return c4Height(state, column) < C4_ROWS;
}

export function c4LegalMoves(state: C4State): readonly number[] {
  const moves: number[] = [];
  for (let column = 0; column < C4_COLS; column += 1) {
    if (c4CanDrop(state, column)) moves.push(column);
  }
  return moves;
}

export function c4ApplyMove(state: C4State, column: number, seat: Seat): C4State {
  if (!c4CanDrop(state, column)) return state;
  const index = cellIndex(column, c4Height(state, column));
  const next = state.slice();
  next[index] = seat;
  return next;
}

const DIRECTIONS = [
  [0, 1],
  [1, 0],
  [1, 1],
  [1, -1],
] as const;

function lineAt(state: C4State, column: number, row: number, seat: Seat): number[] {
  const cells: number[] = [];
  for (const [dc, dr] of DIRECTIONS) {
    for (const sign of [1, -1] as const) {
      let c = column + dc * sign;
      let r = row + dr * sign;
      while (c >= 0 && c < C4_COLS && r >= 0 && r < C4_ROWS && state[cellIndex(c, r)] === seat) {
        cells.push(cellIndex(c, r));
        c += dc * sign;
        r += dr * sign;
      }
    }
  }
  cells.push(cellIndex(column, row));
  return cells;
}

export function c4Evaluate(state: C4State): RoundResult {
  for (let column = 0; column < C4_COLS; column += 1) {
    for (let row = 0; row < C4_ROWS; row += 1) {
      const seat = state[cellIndex(column, row)];
      if (!seat) continue;
      const cells = lineAt(state, column, row, seat);
      if (cells.length >= 4) return { status: 'won', winner: seat, highlight: cells };
    }
  }
  return state.every((cell) => cell !== null) ? { status: 'draw' } : { status: 'playing' };
}

export function c4DescribeMove(_state: C4State, column: number, seat: Seat): string {
  return `${seat === 'p1' ? 'Player 1' : 'Player 2'} dropped into column ${column + 1}`;
}

export const connect4: GameAdapter<C4State, number> = {
  id: 'connect4',
  name: 'Connect Four',
  tagline: 'Drop, connect four, own the board.',
  supportsAi: true,
  createState: createC4State,
  legalMoves: c4LegalMoves,
  isLegal: c4CanDrop,
  applyMove: c4ApplyMove,
  evaluate: c4Evaluate,
  describeMove: c4DescribeMove,
};
