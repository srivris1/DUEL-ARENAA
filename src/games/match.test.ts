import { describe, expect, it } from 'vitest';
import { createMatch, matchReducer } from './match';
import type { MatchState } from './types';
import type { MatchAction } from './match';

function run(state: MatchState, actions: MatchAction[]): MatchState {
  return actions.reduce(matchReducer, state);
}

describe('match reducer', () => {
  it('alternates turns and rejects moves from the wrong seat', () => {
    const state = matchReducer(createMatch('tictactoe', 3), {
      type: 'PLAY',
      move: 0,
      seat: 'p1',
    });
    expect(state.turn).toBe('p2');
    expect(matchReducer(state, { type: 'PLAY', move: 1, seat: 'p1' })).toBe(state);
  });

  it('ignores moves after the round is decided', () => {
    const finished = run(createMatch('tictactoe', 3), [
      { type: 'PLAY', move: 0, seat: 'p1' },
      { type: 'PLAY', move: 3, seat: 'p2' },
      { type: 'PLAY', move: 1, seat: 'p1' },
      { type: 'PLAY', move: 4, seat: 'p2' },
      { type: 'PLAY', move: 2, seat: 'p1' },
    ]);
    expect(finished.result.status).toBe('won');
    expect(matchReducer(finished, { type: 'PLAY', move: 5, seat: 'p2' })).toBe(finished);
  });

  it('awards the round inside the reducer and tracks history', () => {
    const state = run(createMatch('tictactoe', 3), [
      { type: 'PLAY', move: 0, seat: 'p1' },
      { type: 'PLAY', move: 3, seat: 'p2' },
      { type: 'PLAY', move: 1, seat: 'p1' },
      { type: 'PLAY', move: 4, seat: 'p2' },
      { type: 'PLAY', move: 2, seat: 'p1' },
    ]);
    expect(state.scores).toEqual({ p1: 1, p2: 0, draws: 0 });
    expect(state.history.at(-1)).toEqual({ round: 1, gameId: 'tictactoe', outcome: 'p1' });
  });

  it('ends a best of three once a player reaches two round wins', () => {
    const winRound = (state: MatchState, moves: number[]): MatchState =>
      moves.reduce((current, move) => {
        const seat = current.turn;
        return matchReducer(current, { type: 'PLAY', move, seat });
      }, state);

    let state = winRound(createMatch('tictactoe', 3), [0, 3, 1, 4, 2]);
    expect(state.matchOver).toBe(false);
    state = matchReducer(state, { type: 'NEXT_ROUND' });
    expect(state.round).toBe(2);
    expect(state.starter).toBe('p2');
    expect(state.turn).toBe('p2');
    state = winRound(state, [0, 3, 1, 4, 8, 5]);
    expect(state.scores).toEqual({ p1: 2, p2: 0, draws: 0 });
    expect(state.matchOver).toBe(true);
    expect(state.champion).toBe('p1');
    expect(matchReducer(state, { type: 'NEXT_ROUND' })).toBe(state);
  });

  it('counts a drawn round and keeps play going', () => {
    const state = run(createMatch('tictactoe', 3), [
      { type: 'PLAY', move: 0, seat: 'p1' },
      { type: 'PLAY', move: 1, seat: 'p2' },
      { type: 'PLAY', move: 2, seat: 'p1' },
      { type: 'PLAY', move: 4, seat: 'p2' },
      { type: 'PLAY', move: 3, seat: 'p1' },
      { type: 'PLAY', move: 5, seat: 'p2' },
      { type: 'PLAY', move: 7, seat: 'p1' },
      { type: 'PLAY', move: 6, seat: 'p2' },
      { type: 'PLAY', move: 8, seat: 'p1' },
    ]);
    expect(state.result.status).toBe('draw');
    expect(state.scores.draws).toBe(1);
  });

  it('switches games and match length with a fresh board', () => {
    const played = matchReducer(createMatch('tictactoe', 3), {
      type: 'PLAY',
      move: 0,
      seat: 'p1',
    });
    const switched = matchReducer(played, { type: 'SET_GAME', gameId: 'connect4' });
    expect(switched.gameId).toBe('connect4');
    expect(switched.scores).toEqual({ p1: 0, p2: 0, draws: 0 });
    expect(matchReducer(played, { type: 'SET_BEST_OF', bestOf: 5 }).bestOf).toBe(5);
  });

  it('resets the whole match', () => {
    const played = matchReducer(createMatch('tictactoe', 1), {
      type: 'PLAY',
      move: 0,
      seat: 'p1',
    });
    const reset = matchReducer(played, { type: 'RESET' });
    expect(reset).toEqual(createMatch('tictactoe', 1));
  });
});
