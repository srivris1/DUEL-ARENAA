import type { GameId, GameAdapter, MatchState, Move, RoundRecord, Scores, Seat } from './types';
import { otherSeat, winsNeeded } from './types';
import { tictactoe } from './tictactoe';
import { connect4 } from './connect4';
import { rps } from './rps';

export const GAMES = [tictactoe, connect4, rps] as const;

const REGISTRY: Record<GameId, GameAdapter<never, never>> = {
  tictactoe: tictactoe as unknown as GameAdapter<never, never>,
  connect4: connect4 as unknown as GameAdapter<never, never>,
  rps: rps as unknown as GameAdapter<never, never>,
};

export function getGame(gameId: GameId): GameAdapter {
  return REGISTRY[gameId] as unknown as GameAdapter;
}

export function createMatch(gameId: GameId = 'tictactoe', bestOf: 1 | 3 | 5 | 7 = 3): MatchState {
  return {
    gameId,
    game: getGame(gameId).createState(),
    turn: 'p1',
    starter: 'p1',
    round: 1,
    bestOf,
    scores: { p1: 0, p2: 0, draws: 0 },
    result: { status: 'playing' },
    history: [],
    matchOver: false,
    champion: null,
  };
}

export type MatchAction =
  | { readonly type: 'PLAY'; readonly move: Move; readonly seat: Seat }
  | { readonly type: 'NEXT_ROUND' }
  | { readonly type: 'RESET' }
  | { readonly type: 'SET_GAME'; readonly gameId: GameId }
  | { readonly type: 'SET_BEST_OF'; readonly bestOf: 1 | 3 | 5 | 7 };

function isReplayDraw(gameId: GameId): boolean {
  return gameId === 'rps';
}

export function matchReducer(state: MatchState, action: MatchAction): MatchState {
  switch (action.type) {
    case 'PLAY': {
      if (state.result.status !== 'playing' || state.matchOver) return state;
      if (action.seat !== state.turn) return state;
      const adapter = getGame(state.gameId);
      if (!adapter.isLegal(state.game, action.move, action.seat)) return state;

      const game = adapter.applyMove(state.game, action.move, action.seat);
      const result = adapter.evaluate(game);

      if (result.status === 'playing') {
        return { ...state, game, result, turn: otherSeat(state.turn) };
      }

      if (result.status === 'draw' && isReplayDraw(state.gameId)) {
        const record: RoundRecord = { round: state.round, gameId: state.gameId, outcome: 'draw' };
        return {
          ...state,
          game: adapter.createState(),
          result: { status: 'playing' },
          turn: state.starter,
          history: [...state.history, record],
        };
      }

      const scores: Scores =
        result.status === 'won'
          ? { ...state.scores, [result.winner]: state.scores[result.winner] + 1 }
          : { ...state.scores, draws: state.scores.draws + 1 };

      const record: RoundRecord = {
        round: state.round,
        gameId: state.gameId,
        outcome: result.status === 'won' ? result.winner : 'draw',
      };

      const matchOver = result.status === 'won' && scores[result.winner] >= winsNeeded(state.bestOf);

      return {
        ...state,
        game,
        result,
        scores,
        history: [...state.history, record],
        matchOver,
        champion: matchOver && result.status === 'won' ? result.winner : state.champion,
      };
    }
    case 'NEXT_ROUND': {
      if (state.matchOver || state.result.status === 'playing') return state;
      const starter = otherSeat(state.starter);
      const adapter = getGame(state.gameId);
      return {
        ...state,
        game: adapter.createState(),
        starter,
        turn: starter,
        round: state.round + 1,
        result: { status: 'playing' },
      };
    }
    case 'RESET':
      return createMatch(state.gameId, state.bestOf);
    case 'SET_GAME':
      if (state.gameId === action.gameId) return state;
      return createMatch(action.gameId, state.bestOf);
    case 'SET_BEST_OF':
      if (state.bestOf === action.bestOf) return state;
      return createMatch(state.gameId, action.bestOf);
    default: {
      const unreachable: never = action;
      return unreachable;
    }
  }
}
