import type { Choice, GameAdapter, RoundResult, Seat } from './types';

export const CHOICES = ['rock', 'paper', 'scissors'] as const;

const BEATS: Record<Choice, Choice> = {
  rock: 'scissors',
  paper: 'rock',
  scissors: 'paper',
};

export type RpsState = {
  readonly picks: Readonly<Record<Seat, Choice | null>>;
  readonly revealed: boolean;
  readonly lastWinner: Seat | 'draw' | null;
};

export function createRpsState(): RpsState {
  return { picks: { p1: null, p2: null }, revealed: false, lastWinner: null };
}

export function isChoice(value: string): value is Choice {
  return (CHOICES as readonly string[]).includes(value);
}

export function beats(left: Choice, right: Choice): boolean {
  return BEATS[left] === right;
}

export function rpsJudge(left: Choice, right: Choice): Seat | 'draw' {
  if (left === right) return 'draw';
  return beats(left, right) ? 'p1' : 'p2';
}

export function rpsLegalMoves(state: RpsState, seat: Seat): readonly Choice[] {
  if (state.revealed || state.picks[seat] !== null) return [];
  return CHOICES;
}

export function rpsApplyMove(state: RpsState, choice: Choice, seat: Seat): RpsState {
  if (state.revealed || state.picks[seat] !== null) return state;
  const picks = { ...state.picks, [seat]: choice };
  const revealed = picks.p1 !== null && picks.p2 !== null;
  return {
    picks,
    revealed,
    lastWinner: revealed ? rpsJudge(picks.p1 as Choice, picks.p2 as Choice) : null,
  };
}

export function rpsEvaluate(state: RpsState): RoundResult {
  if (!state.revealed) return { status: 'playing' };
  const { p1, p2 } = state.picks;
  if (!p1 || !p2) return { status: 'playing' };
  const verdict = rpsJudge(p1, p2);
  return verdict === 'draw'
    ? { status: 'draw' }
    : { status: 'won', winner: verdict, highlight: [] };
}

export function rpsDescribeMove(_state: RpsState, choice: Choice, seat: Seat): string {
  return `${seat === 'p1' ? 'Player 1' : 'Player 2'} threw ${choice}`;
}

export const rps: GameAdapter<RpsState, Choice> = {
  id: 'rps',
  name: 'Rock Paper Scissors',
  tagline: 'Best throw wins. Ties replay.',
  supportsAi: true,
  createState: createRpsState,
  legalMoves: () => CHOICES,
  isLegal: (state, move, seat) => rpsLegalMoves(state, seat).includes(move),
  applyMove: rpsApplyMove,
  evaluate: rpsEvaluate,
  describeMove: rpsDescribeMove,
};
