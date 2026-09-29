import { describe, expect, it } from 'vitest';
import {
  canControl,
  createSessionState,
  isAuthoritative,
  MAX_CHAT_LINES,
  sessionReducer,
} from './sessionReducer';
import { createMatch } from '../games/match';
import type { ChatLine } from '../net/protocol';

function line(index: number): ChatLine {
  return { id: String(index), seat: 'p1', author: 'Host', text: `msg ${index}`, at: index };
}

describe('session reducer', () => {
  it('starts in the menu with a default match', () => {
    const state = createSessionState();
    expect(state.mode).toBe('menu');
    expect(state.match).toEqual(createMatch('tictactoe', 3));
    expect(state.chat).toEqual([]);
  });

  it('modes carry the code and seat', () => {
    const hosted = sessionReducer(createSessionState(), {
      type: 'setMode',
      mode: 'host',
      code: 'ABCDE',
    });
    expect(hosted.code).toBe('ABCDE');
    expect(hosted.seat).toBe('p1');
    const joined = sessionReducer(hosted, {
      type: 'setMode',
      mode: 'guest',
      code: 'ABCDE',
      seat: 'p2',
    });
    expect(joined.seat).toBe('p2');
  });

  it('applies local match actions and adopts remote snapshots', () => {
    const local = sessionReducer(createSessionState(), {
      type: 'applyMatch',
      action: { type: 'PLAY', move: 4, seat: 'p1' },
    });
    expect(local.match.turn).toBe('p2');

    const remoteState = createMatch('connect4', 5);
    const remote = sessionReducer(local, { type: 'remoteState', state: remoteState });
    expect(remote.match).toBe(remoteState);
  });

  it('caps the chat log', () => {
    let state = createSessionState();
    for (let index = 0; index < MAX_CHAT_LINES + 10; index += 1) {
      state = sessionReducer(state, { type: 'addChat', line: line(index) });
    }
    expect(state.chat).toHaveLength(MAX_CHAT_LINES);
    expect(state.chat.at(-1)?.text).toBe(`msg ${MAX_CHAT_LINES + 9}`);
  });

  it('marks host and local sessions as authoritative, guests are not', () => {
    expect(isAuthoritative({ ...createSessionState(), mode: 'host' })).toBe(true);
    expect(isAuthoritative({ ...createSessionState(), mode: 'local' })).toBe(true);
    expect(isAuthoritative({ ...createSessionState(), mode: 'guest' })).toBe(false);
  });

  it('locks the seat handled by the bot', () => {
    const withBot = { ...createSessionState(), mode: 'local' as const, aiSeat: 'p2' as const };
    expect(canControl(withBot, 'p2')).toBe(false);
    expect(canControl(withBot, 'p1')).toBe(true);
  });

  it('only lets the host move for its own seat in a live room', () => {
    const hosting = { ...createSessionState(), mode: 'host' as const, seat: 'p1' as const };
    expect(canControl(hosting, 'p1')).toBe(true);
    expect(canControl(hosting, 'p2')).toBe(false);
  });

  it('only lets the guest move for its own seat in a live room', () => {
    const guesting = { ...createSessionState(), mode: 'guest' as const, seat: 'p2' as const };
    expect(canControl(guesting, 'p2')).toBe(true);
    expect(canControl(guesting, 'p1')).toBe(false);
  });

  it('records rematch requests without duplicates', () => {
    let state = createSessionState();
    state = sessionReducer(state, { type: 'rematchRequest', seat: 'p2' });
    state = sessionReducer(state, { type: 'rematchRequest', seat: 'p2' });
    expect(state.pendingRematch).toEqual(['p2']);
    state = sessionReducer(state, { type: 'clearRematch' });
    expect(state.pendingRematch).toEqual([]);
  });

  it('stores errors and clears the connection status', () => {
    const state = sessionReducer(createSessionState(), { type: 'error', message: 'boom' });
    expect(state.error).toBe('boom');
    expect(state.conn).toBe('failed');
  });
});
