import { motion } from 'framer-motion';
import type { Seat } from '../../games/types';
import type { TttState } from '../../games/tictactoe';

type Props = {
  readonly state: TttState;
  readonly highlight: readonly number[];
  readonly locked: boolean;
  readonly accent: (seat: Seat | null) => string;
  readonly onMove: (index: number) => void;
};

function markFor(value: Seat | null) {
  if (!value) return null;
  return (
    <motion.svg
      viewBox="0 0 64 64"
      className="h-[52%] w-[52%]"
      aria-hidden
      initial={{ scale: 0.2, rotate: value === 'p1' ? -25 : 25, opacity: 0 }}
      animate={{ scale: 1, rotate: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 420, damping: 22 }}
    >
      {value === 'p1' ? (
        <g stroke="currentColor" strokeWidth={6} strokeLinecap="round" fill="none">
          <line x1={16} y1={16} x2={48} y2={48} />
          <line x1={48} y1={16} x2={16} y2={48} />
        </g>
      ) : (
        <circle cx={32} cy={32} r={21} stroke="currentColor" strokeWidth={6} fill="none" />
      )}
    </motion.svg>
  );
}

export function TicTacToeBoard({ state, highlight, locked, accent, onMove }: Props) {
  return (
    <div
      role="grid"
      aria-label="Tic tac toe board"
      className="grid w-full max-w-[460px] grid-cols-3 gap-3"
    >
      {state.map((value, index) => {
        const row = Math.floor(index / 3) + 1;
        const column = (index % 3) + 1;
        const winning = highlight.includes(index);
        return (
          <button
            key={index}
            type="button"
            role="gridcell"
            disabled={locked || value !== null}
            onClick={() => onMove(index)}
            aria-label={`Row ${row}, column ${column}: ${value ?? 'empty'}`}
            className={`relative flex aspect-square items-center justify-center rounded-2xl border text-ink transition-colors ${
              winning ? 'border-accent bg-accent-tint' : 'border-boundary bg-surface'
            } ${value === null && !locked ? 'hover:border-accent' : ''} ${locked ? 'cursor-default' : ''}`}
          >
            <span className={accent(value)}>{markFor(value)}</span>
            {winning && (
              <motion.span
                layoutId={`win-${index}`}
                className="pointer-events-none absolute inset-0 rounded-2xl"
                initial={{ opacity: 0.35 }}
                animate={{ opacity: [0.2, 0.6, 0.2] }}
                transition={{ repeat: Infinity, duration: 1.4 }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
