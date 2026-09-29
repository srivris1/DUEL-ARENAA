import { AnimatePresence, motion } from 'framer-motion';
import { Hand, Paperclip, Scissors } from 'lucide-react';
import type { Choice, Seat } from '../../games/types';
import type { RpsState } from '../../games/rps';

const CHOICES = [
  { id: 'rock' as const, label: 'Rock', Icon: Hand, hint: 'Crushes scissors' },
  { id: 'paper' as const, label: 'Paper', Icon: Paperclip, hint: 'Covers rock' },
  { id: 'scissors' as const, label: 'Scissors', Icon: Scissors, hint: 'Cuts paper' },
];

type Props = {
  readonly state: RpsState;
  readonly activeSeat: Seat;
  readonly locked: boolean;
  readonly onMove: (choice: Choice) => void;
  readonly playerLabel: (seat: Seat) => string;
  readonly accent: (seat: Seat) => string;
};

function Throw({ choice, revealed, seat }: { choice: Choice | null; revealed: boolean; seat: Seat }) {
  if (!choice) {
    return (
      <span className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-dashed border-boundary text-xs text-muted">
        waiting
      </span>
    );
  }
  const Icon = CHOICES.find((item) => item.id === choice)?.Icon ?? Hand;
  return (
    <AnimatePresence mode="wait">
      <motion.span
        key={`${seat}-${revealed ? 'shown' : 'hidden'}`}
        initial={{ scale: 0.4, rotate: revealed ? 0 : 40, opacity: 0 }}
        animate={{ scale: 1, rotate: 0, opacity: 1 }}
        exit={{ scale: 0.4, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 380, damping: 20 }}
        className={`flex h-20 w-20 items-center justify-center rounded-full border-2 ${
          seat === 'p1' ? 'border-p1 bg-p1-tint text-p1' : 'border-p2 bg-p2-tint text-p2'
        }`}
      >
        {revealed ? <Icon size={38} aria-hidden /> : <span className="text-2xl">?</span>}
      </motion.span>
    </AnimatePresence>
  );
}

export function RpsArena({ state, activeSeat, locked, onMove, playerLabel, accent }: Props) {
  const myChoice = state.picks[activeSeat];
  const winner = state.revealed ? state.lastWinner : null;
  const waitingForMe = !locked && !state.revealed && myChoice === null;

  return (
    <div className="w-full max-w-[520px]">
      <div className="flex items-center justify-between gap-4">
        {(['p1', 'p2'] as const).map((seat) => (
          <div key={seat} className="flex flex-1 flex-col items-center gap-2">
            <span className="text-sm font-semibold text-ink">{playerLabel(seat)}</span>
            <Throw choice={state.picks[seat]} revealed={state.revealed} seat={seat} />
            <span className={`text-xs ${accent(seat)}`}>
              {state.revealed
                ? (state.picks[seat] ?? '')
                : state.picks[seat]
                  ? 'locked in'
                  : 'thinking'}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-6 flex min-h-14 items-center justify-center">
        {state.revealed ? (
          <motion.p
            key={winner ?? 'draw'}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`text-center text-xl font-semibold ${
              winner === 'draw' || winner === null ? 'text-accent' : accent(winner)
            }`}
          >
            {winner === 'draw' || winner === null
              ? 'Tie — throw again!'
              : `${playerLabel(winner)} wins the throw`}
          </motion.p>
        ) : (
          <p className="text-sm text-muted">
            {waitingForMe ? 'Pick your throw' : 'Waiting for your opponent'}
          </p>
        )}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3">
        {CHOICES.map(({ id, label, Icon, hint }) => (
          <motion.button
            key={id}
            type="button"
            disabled={!waitingForMe}
            onClick={() => onMove(id)}
            whileHover={waitingForMe ? { y: -3 } : undefined}
            whileTap={waitingForMe ? { scale: 0.96 } : undefined}
            aria-label={`Throw ${label}`}
            className={`flex flex-col items-center gap-2 rounded-2xl border p-4 transition-colors ${
              myChoice === id ? 'border-accent bg-accent-tint' : 'border-boundary bg-surface'
            } disabled:cursor-default disabled:opacity-55 enabled:hover:border-accent`}
          >
            <Icon size={30} aria-hidden className="text-ink" />
            <span className="text-sm font-semibold text-ink">{label}</span>
            <span className="text-[11px] text-muted">{hint}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
