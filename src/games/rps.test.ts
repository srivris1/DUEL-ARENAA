import { describe, expect, it } from 'vitest';
import { createRpsState, isChoice, rpsApplyMove, rpsEvaluate, rpsJudge } from './rps';
import { createMatch, matchReducer } from './match';
import type { MatchState } from './types';

describe('rock paper scissors rules', () => {
  it('judges the three matchups', () => {
    expect(rpsJudge('rock', 'scissors')).toBe('p1');
    expect(rpsJudge('paper', 'rock')).toBe('p1');
    expect(rpsJudge('scissors', 'paper')).toBe('p1');
    expect(rpsJudge('rock', 'paper')).toBe('p2');
    expect(rpsJudge('rock', 'rock')).toBe('draw');
  });

  it('validates choices', () => {
    expect(isChoice('rock')).toBe(true);
    expect(isChoice('lizard')).toBe(false);
  });

  it('reveals only after both players choose', () => {
    const first = rpsApplyMove(createRpsState(), 'rock', 'p1');
    expect(rpsEvaluate(first)).toEqual({ status: 'playing' });
    const second = rpsApplyMove(first, 'paper', 'p2');
    expect(second.revealed).toBe(true);
    expect(rpsEvaluate(second)).toEqual({ status: 'won', winner: 'p2', highlight: [] });
  });

  it('ignores a second throw from the same player', () => {
    const once = rpsApplyMove(createRpsState(), 'rock', 'p1');
    expect(rpsApplyMove(once, 'paper', 'p1')).toBe(once);
  });

  it('replays a tied throw without changing the score', () => {
    let state: MatchState = createMatch('rps', 3);
    state = matchReducer(state, { type: 'PLAY', move: 'rock', seat: 'p1' });
    state = matchReducer(state, { type: 'PLAY', move: 'rock', seat: 'p2' });
    expect(state.scores).toEqual({ p1: 0, p2: 0, draws: 0 });
    expect(state.round).toBe(1);
    expect(state.result.status).toBe('playing');
    expect(state.matchOver).toBe(false);
    expect(state.history).toHaveLength(1);
  });
});
