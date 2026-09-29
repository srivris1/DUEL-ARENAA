import { motion } from 'framer-motion';
import { Gamepad2, Grid3x3, Hand, Columns3 } from 'lucide-react';
import { GAMES } from '../games/match';
import type { GameId } from '../games/types';

const ICONS: Record<GameId, typeof Grid3x3> = {
  tictactoe: Grid3x3,
  connect4: Columns3,
  rps: Hand,
};

type Props = {
  readonly selected: GameId;
  readonly onSelect: (id: GameId) => void;
  readonly disabled?: boolean;
  readonly compact?: boolean;
};

export function GamePicker({ selected, onSelect, disabled = false, compact = false }: Props) {
  return (
    <div className={`grid gap-3 ${compact ? 'grid-cols-3' : 'sm:grid-cols-3'}`} role="radiogroup" aria-label="Choose a game">
      {GAMES.map((game) => {
        const Icon = ICONS[game.id];
        const active = game.id === selected;
        return (
          <motion.button
            key={game.id}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={disabled}
            onClick={() => onSelect(game.id)}
            whileHover={disabled ? undefined : { y: -3 }}
            whileTap={disabled ? undefined : { scale: 0.97 }}
            className={`surface-card rounded-2xl p-4 text-left transition-colors ${
              active ? 'border-accent' : 'border-boundary'
            } ${disabled ? 'opacity-50' : ''}`}
          >
            <span className="flex items-center gap-2">
              <Icon size={compact ? 18 : 22} className={active ? 'text-accent' : 'text-muted'} aria-hidden />
              <span className="font-semibold text-ink">{game.name}</span>
            </span>
            {!compact && <span className="mt-1 block text-xs text-muted">{game.tagline}</span>}
          </motion.button>
        );
      })}
    </div>
  );
}

export function GameIcon({ id, size = 18 }: { id: GameId; size?: number }) {
  const Icon = ICONS[id] ?? Gamepad2;
  return <Icon size={size} aria-hidden />;
}
