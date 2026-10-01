import { getGame } from './match';
import type { GameId, Move, Seat } from './types';
import { otherSeat } from './types';

export type Difficulty = 'casual' | 'sharp';

const DEPTH: Record<Difficulty, number> = {
  casual: 2,
  sharp: 6,
};

function scoreFor(result: { status: string; winner?: Seat }, seat: Seat, depth: number): number {
  if (result.status === 'won') {
    return result.winner === seat ? 1000 - depth : -1000 + depth;
  }
  if (result.status === 'draw') return 0;
  return -depth;
}

function search(
  gameId: GameId,
  state: unknown,
  seat: Seat,
  depth: number,
  alpha: number,
  beta: number,
): { move: Move | null; value: number } {
  const adapter = getGame(gameId);
  const moves = adapter.legalMoves(state);
  if (moves.length === 0 || depth === 0) {
    return { move: null, value: scoreFor(adapter.evaluate(state), seat, 0) };
  }

  let best: { move: Move | null; value: number } = { move: null, value: -Infinity };

  for (const move of moves) {
    const next = adapter.applyMove(state, move, seat);
    const value = -search(gameId, next, otherSeat(seat), depth - 1, -beta, -alpha).value;
    if (value > best.value) best = { move, value };
    if (value > alpha) alpha = value;
    if (alpha >= beta) break;
  }

  return best;
}

export function pickAiMove(gameId: GameId, state: unknown, seat: Seat, difficulty: Difficulty): Move | null {
  const adapter = getGame(gameId);
  const moves = adapter.legalMoves(state);
  if (moves.length === 0) return null;

  if (difficulty === 'casual' && moves.length > 1) {
    const index = Math.floor(Math.random() * moves.length);
    return moves[index];
  }

  const depth = Math.min(DEPTH[difficulty], gameId === 'connect4' ? 6 : DEPTH[difficulty]);
  const { move } = search(gameId, state, seat, depth, -Infinity, Infinity);
  return move ?? moves[0];
}
