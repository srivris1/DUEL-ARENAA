export type Seat = 'p1' | 'p2';
export type GameId = 'tictactoe' | 'connect4' | 'rps';
export type BestOf = 1 | 3 | 5 | 7;

export type Choice = 'rock' | 'paper' | 'scissors';

export type RoundResult =
  | { readonly status: 'playing' }
  | { readonly status: 'won'; readonly winner: Seat; readonly highlight: readonly number[] }
  | { readonly status: 'draw' };

export type Scores = { readonly p1: number; readonly p2: number; readonly draws: number };

export type RoundRecord = {
  readonly round: number;
  readonly gameId: GameId;
  readonly outcome: 'p1' | 'p2' | 'draw';
};

export type MatchState = {
  readonly gameId: GameId;
  readonly game: unknown;
  readonly turn: Seat;
  readonly starter: Seat;
  readonly round: number;
  readonly bestOf: BestOf;
  readonly scores: Scores;
  readonly result: RoundResult;
  readonly history: readonly RoundRecord[];
  readonly matchOver: boolean;
  readonly champion: Seat | null;
};

export type Move = number | string;

export type GameAdapter<T = unknown, M extends Move = Move> = {
  readonly id: GameId;
  readonly name: string;
  readonly tagline: string;
  readonly supportsAi: boolean;
  createState: () => T;
  legalMoves: (state: T) => readonly M[];
  isLegal: (state: T, move: M, seat: Seat) => boolean;
  applyMove: (state: T, move: M, seat: Seat) => T;
  evaluate: (state: T) => RoundResult;
  describeMove: (state: T, move: M, seat: Seat) => string;
};

export function otherSeat(seat: Seat): Seat {
  return seat === 'p1' ? 'p2' : 'p1';
}

export function winsNeeded(bestOf: BestOf): number {
  return Math.floor(bestOf / 2) + 1;
}
