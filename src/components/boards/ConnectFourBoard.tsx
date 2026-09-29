import { motion } from 'framer-motion';
import type { Seat } from '../../games/types';
import { C4_COLS, C4_ROWS, cellIndex, c4CanDrop } from '../../games/connect4';
import type { C4State } from '../../games/connect4';

type Props = {
  readonly state: C4State;
  readonly highlight: readonly number[];
  readonly locked: boolean;
  readonly accent: (seat: Seat | null) => string;
  readonly onMove: (column: number) => void;
};

function disc(seat: Seat | null) {
  if (!seat) return null;
  return (
    <motion.span
      initial={{ y: -260, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 480, damping: 24 }}
      className={`flex h-[86%] w-[86%] items-center justify-center rounded-full ${
        seat === 'p1' ? 'bg-p1' : 'bg-p2'
      } shadow-[0_6px_14px_rgba(0,0,0,0.35)]`}
    >
      <span className="h-1/3 w-1/3 rounded-full bg-white/30" />
    </motion.span>
  );
}

export function ConnectFourBoard({ state, highlight, locked, accent, onMove }: Props) {
  const rows = Array.from({ length: C4_ROWS }, (_, row) => C4_ROWS - 1 - row);
  const columns = Array.from({ length: C4_COLS }, (_, column) => column);

  return (
    <div className="w-full max-w-[560px]">
      <div className="mb-2 grid grid-cols-7 gap-2">
        {columns.map((column) => {
          const full = !c4CanDrop(state, column);
          return (
            <button
              key={column}
              type="button"
              disabled={locked || full}
              onClick={() => onMove(column)}
              aria-label={`Drop into column ${column + 1}`}
              className="h-7 rounded-lg transition-colors hover:bg-accent-tint disabled:cursor-default disabled:opacity-40"
            />
          );
        })}
      </div>
      <div role="grid" aria-label="Connect four board" className="flex flex-col gap-2">
        {rows.map((row) => (
          <div key={row} className="grid grid-cols-7 gap-2">
            {columns.map((column) => {
              const value = state[cellIndex(column, row)];
              const winning = highlight.includes(cellIndex(column, row));
              return (
                <div
                  key={column}
                  role="gridcell"
                  aria-label={`Column ${column + 1}, row ${C4_ROWS - row}: ${value ?? 'empty'}`}
                  className={`flex aspect-square items-center justify-center rounded-full border ${
                    winning ? 'border-accent bg-accent-tint' : 'border-boundary bg-surface'
                  }`}
                >
                  <span className={accent(value)}>{disc(value)}</span>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
