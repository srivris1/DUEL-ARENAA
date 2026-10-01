import { motion } from 'framer-motion';
import type { MatchState, Seat } from '../games/types';
import { winsNeeded } from '../games/types';

type Props = {
  readonly match: MatchState;
  readonly names: Record<Seat, string>;
  readonly mySeat: Seat;
  readonly accent: (seat: Seat) => string;
  readonly opponentPresent: boolean;
};

function statusText(match: MatchState, names: Record<Seat, string>, mySeat: Seat): string {
  if (match.matchOver && match.champion) {
    return `${names[match.champion]} wins the match`;
  }
  if (match.result.status === 'won') return `${names[match.result.winner]} takes the round`;
  if (match.result.status === 'draw') return 'Round drawn';
  return match.turn === mySeat ? 'Your move' : `${names[match.turn]}'s move`;
}

export function ScoreHeader({ match, names, mySeat, accent, opponentPresent }: Props) {
  const target = winsNeeded(match.bestOf);
  const activeSeat = match.result.status === 'playing' ? match.turn : null;

  const renderSeat = (seat: Seat) => {
    const isActive = activeSeat === seat;
    return (
      <div
        key={seat}
        className={`surface-card border border-boundary relative rounded-2xl px-4 py-3 transition-shadow ${
          isActive ? (seat === 'p1' ? 'glow-p1' : 'glow-p2') : ''
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <span className="min-w-0">
            <span className={`block truncate text-sm font-semibold ${accent(seat)}`}>
              {names[seat]}
            </span>
            <span className="block text-[11px] text-muted">
              {seat === mySeat ? 'you' : opponentPresent ? 'opponent' : 'open seat'}
            </span>
          </span>
          <motion.span
            key={match.scores[seat]}
            initial={{ scale: 0.6, opacity: 0.4 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-3xl font-semibold text-ink"
          >
            {match.scores[seat]}
          </motion.span>
        </div>
        <div className="mt-2 flex gap-1">
          {Array.from({ length: target }, (_, index) => (
            <span
              key={index}
              className={`h-1 flex-1 rounded-full ${
                index < match.scores[seat]
                  ? seat === 'p1'
                    ? 'bg-p1'
                    : 'bg-p2'
                  : 'bg-boundary'
              }`}
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
      {renderSeat('p1')}

      <div className="order-first text-center sm:order-none">
        <p className="pill border border-boundary text-muted">Round {match.round}</p>
        <p className="mt-2 text-sm font-medium text-ink">{statusText(match, names, mySeat)}</p>
        <p className="text-[11px] text-muted">First to {target}</p>
      </div>

      {renderSeat('p2')}
    </div>
  );
}
