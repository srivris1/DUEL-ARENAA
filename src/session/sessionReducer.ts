import { createMatch, matchReducer } from '../games/match';
import type { MatchAction } from '../games/match';
import type { BestOf, GameId, MatchState, Seat } from '../games/types';
import type { ChatLine } from '../net/protocol';
import type { ConnStatus, Mode } from './types';
import type { Difficulty } from '../games/ai';

export type SessionState = {
  readonly mode: Mode;
  readonly conn: ConnStatus;
  readonly code: string | null;
  readonly seat: Seat;
  readonly names: Record<Seat, string>;
  readonly match: MatchState;
  readonly chat: readonly ChatLine[];
  readonly error: string | null;
  readonly aiSeat: Seat | null;
  readonly difficulty: Difficulty;
  readonly pendingRematch: readonly Seat[];
  readonly banner: string | null;
};

export type SessionAction =
  | { readonly type: 'setMode'; readonly mode: Mode; readonly code?: string; readonly seat?: Seat }
  | { readonly type: 'conn'; readonly status: ConnStatus }
  | { readonly type: 'error'; readonly message: string | null }
  | { readonly type: 'applyMatch'; readonly action: MatchAction }
  | { readonly type: 'remoteState'; readonly state: MatchState; readonly chat?: readonly ChatLine[] }
  | { readonly type: 'addChat'; readonly line: ChatLine }
  | { readonly type: 'setChat'; readonly lines: readonly ChatLine[] }
  | { readonly type: 'setNames'; readonly names: Record<Seat, string> }
  | { readonly type: 'setAi'; readonly seat: Seat | null; readonly difficulty?: Difficulty }
  | { readonly type: 'setDifficulty'; readonly difficulty: Difficulty }
  | { readonly type: 'rematchRequest'; readonly seat: Seat }
  | { readonly type: 'clearRematch' }
  | { readonly type: 'banner'; readonly text: string | null };

export const MAX_CHAT_LINES = 60;

const EMPTY_NAMES: Record<Seat, string> = { p1: 'Player 1', p2: 'Player 2' };

export function createSessionState(overrides: Partial<SessionState> = {}): SessionState {
  return {
    mode: 'menu',
    conn: 'offline',
    code: null,
    seat: 'p1',
    names: EMPTY_NAMES,
    match: createMatch('tictactoe', 3),
    chat: [],
    error: null,
    aiSeat: null,
    difficulty: 'sharp',
    pendingRematch: [],
    banner: null,
    ...overrides,
  };
}

function appendChat(lines: readonly ChatLine[], line: ChatLine): readonly ChatLine[] {
  return [...lines, line].slice(-MAX_CHAT_LINES);
}

export function sessionReducer(state: SessionState, action: SessionAction): SessionState {
  switch (action.type) {
    case 'setMode': {
      const next = createSessionState({ mode: action.mode });
      return {
        ...next,
        match: createMatch(state.match.gameId, state.match.bestOf),
        code: action.code ?? null,
        seat: action.seat ?? 'p1',
        names: state.names,
        chat: state.chat,
        difficulty: state.difficulty,
        aiSeat: state.mode === 'local' ? state.aiSeat : null,
      };
    }
    case 'conn':
      return { ...state, conn: action.status, error: action.status === 'failed' ? state.error : null };
    case 'error':
      return { ...state, error: action.message, conn: action.message ? 'failed' : state.conn };
    case 'applyMatch':
      return { ...state, match: matchReducer(state.match, action.action), pendingRematch: [] };
    case 'remoteState':
      return {
        ...state,
        match: action.state,
        pendingRematch: [],
        chat: action.chat ? action.chat : state.chat,
      };
    case 'addChat':
      return { ...state, chat: appendChat(state.chat, action.line) };
    case 'setChat':
      return { ...state, chat: action.lines.slice(-MAX_CHAT_LINES) };
    case 'setNames':
      return { ...state, names: action.names };
    case 'setAi':
      return { ...state, aiSeat: action.seat, difficulty: action.difficulty ?? state.difficulty };
    case 'setDifficulty':
      return { ...state, difficulty: action.difficulty };
    case 'rematchRequest':
      return state.pendingRematch.includes(action.seat)
        ? state
        : { ...state, pendingRematch: [...state.pendingRematch, action.seat] };
    case 'clearRematch':
      return { ...state, pendingRematch: [] };
    case 'banner':
      return { ...state, banner: action.text };
    default: {
      const unreachable: never = action;
      return unreachable;
    }
  }
}

export function isAuthoritative(state: SessionState): boolean {
  return state.mode === 'host' || state.mode === 'local';
}

export function canControl(state: SessionState, seat: Seat): boolean {
  if (state.aiSeat === seat) return false;
  if (state.mode === 'guest') return seat === state.seat;
  if (state.mode === 'host') return seat === 'p1';
  return state.mode === 'local';
}

export function gameIdOf(state: SessionState): GameId {
  return state.match.gameId;
}

export function bestOfOf(state: SessionState): BestOf {
  return state.match.bestOf;
}
