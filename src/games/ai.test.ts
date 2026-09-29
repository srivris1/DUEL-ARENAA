import { describe, expect, it } from 'vitest';
import { pickAiMove } from './ai';
import { createC4State, c4ApplyMove, c4Evaluate } from './connect4';
import { createTttState, tttApplyMove, tttEvaluate, tttLegalMoves } from './tictactoe';
import { createMatch, matchReducer } from './match';
import type { TttState } from './tictactoe';
import type { MatchState } from './types';

describe('duel bot', () => {
  it('takes an immediate winning move in tic tac toe', () => {
    let state = tttApplyMove(tttApplyMove(createTttState(), 0, 'p1'), 1, 'p1');
    state = tttApplyMove(state, 3, 'p2');
    state = tttApplyMove(state, 4, 'p2');
    expect(pickAiMove('tictactoe', state, 'p1', 'sharp')).toBe(2);
  });

  it('blocks an immediate loss in tic tac toe', () => {
    const state = tttApplyMove(tttApplyMove(createTttState(), 0, 'p2'), 3, 'p2');
    const move = pickAiMove('tictactoe', state, 'p1', 'sharp');
    expect([1, 6]).toContain(move);
  });

  it('drops a legal column in connect four', () => {
    const state = c4ApplyMove(createC4State(), 3, 'p2');
    const move = pickAiMove('connect4', state, 'p1', 'casual') as number;
    expect(move).toBeGreaterThanOrEqual(0);
    expect(move).toBeLessThan(7);
    expect(c4Evaluate(c4ApplyMove(state, move, 'p1')).status).toBe('playing');
  });

  it('always returns a legal rock paper scissors throw', () => {
    expect(['rock', 'paper', 'scissors']).toContain(pickAiMove('rps', createMatch('rps').game, 'p2', 'sharp'));
  });

  it('never leaves the opponent an immediate win in tic tac toe', () => {
    let state: MatchState = createMatch('tictactoe', 3);
    for (let step = 0; step < 9 && state.result.status === 'playing'; step += 1) {
      const game = state.game as TttState;
      const move = pickAiMove('tictactoe', game, state.turn, 'sharp');
      if (move === null) break;
      state = matchReducer(state, { type: 'PLAY', move, seat: state.turn });
      const opponent = state.turn;
      const after = state.game as TttState;
      const hasImmediateWin = tttLegalMoves(after).some(
        (candidate) => tttEvaluate(tttApplyMove(after, candidate, opponent)).status === 'won',
      );
      expect(hasImmediateWin).toBe(false);
    }
    expect(state.history.length).toBeGreaterThan(0);
  });
});
