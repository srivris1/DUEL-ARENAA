import type { GameAdapter, RoundResult, Seat } from './types';

export const TTT_LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
] as const;

export type TttCell = Seat | null;
export type TttState = readonly TttCell[];

export function createTttState(): TttState {
  return Array<TttCell>(9).fill(null);
}

export function tttLegalMoves(state: TttState): readonly number[] {
  const moves: number[] = [];
  for (let index = 0; index < 9; index += 1) {
    if (state[index] === null) moves.push(index);
  }
  return moves;
}

export function tttApplyMove(state: TttState, move: number, seat: Seat): TttState {
  if (!tttLegalMoves(state).includes(move)) return state;
  return state.map((cell, index) => (index === move ? seat : cell));
}

export function tttEvaluate(state: TttState): RoundResult {
  for (const [a, b, c] of TTT_LINES) {
    const winner = state[a];
    if (winner && winner === state[b] && winner === state[c]) {
      const highlight = Array.from(
        new Set(
          TTT_LINES.filter((line) => line.every((index) => state[index] === winner)).flat(),
        ),
      ).sort((left, right) => left - right);
      return { status: 'won', winner, highlight };
    }
  }
  return state.every((cell) => cell !== null) ? { status: 'draw' } : { status: 'playing' };
}

export function tttDescribeMove(_state: TttState, move: number, seat: Seat): string {
  const row = Math.floor(move / 3) + 1;
  const column = (move % 3) + 1;
  return `${seat === 'p1' ? 'Player 1' : 'Player 2'} played row ${row}, column ${column}`;
}

export const tictactoe: GameAdapter<TttState, number> = {
  id: 'tictactoe',
  name: 'Tic-Tac-Toe',
  tagline: 'Three in a row. Classic rules.',
  supportsAi: true,
  createState: createTttState,
  legalMoves: tttLegalMoves,
  isLegal: (state, move) => tttLegalMoves(state).includes(move),

  applyMove: tttApplyMove,
  evaluate: tttEvaluate,
  describeMove: tttDescribeMove,
};
