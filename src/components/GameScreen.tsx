import { useEffect, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, RotateCcw, Trophy, Volume2, VolumeX, Moon, Sun } from 'lucide-react';
import { getGame } from '../games/match';
import { canControl, isAuthoritative } from '../session/sessionReducer';
import type { SessionState } from '../session/sessionReducer';
import type { TttState } from '../games/tictactoe';
import type { C4State } from '../games/connect4';
import type { RpsState } from '../games/rps';
import type { Choice, Move, Seat } from '../games/types';
import type { Difficulty } from '../games/ai';
import { TicTacToeBoard } from './boards/TicTacToeBoard';
import { ConnectFourBoard } from './boards/ConnectFourBoard';
import { RpsArena } from './boards/RpsArena';
import { ScoreHeader } from './ScoreHeader';
import { ChatPanel } from './ChatPanel';
import { RoomBar } from './RoomBar';
import { GamePicker } from './GamePicker';
import { useConfetti } from '../hooks/useConfetti';
import type { useSound } from '../hooks/useSound';

type Props = {
  readonly state: SessionState;
  readonly sound: ReturnType<typeof useSound>;
  readonly onPlay: (move: Move) => void;
  readonly onNextRound: () => void;
  readonly onReset: () => void;
  readonly onLeave: () => void;
  readonly onSelectGame: (id: SessionState['match']['gameId']) => void;
  readonly onChat: (text: string) => void;
  readonly onDifficulty: (difficulty: Difficulty) => void;
  readonly onThemeToggle: () => void;
  readonly theme: 'dark' | 'light';
};

const P1 = 'text-p1';
const P2 = 'text-p2';

export function GameScreen({
  state,
  sound,
  onPlay,
  onNextRound,
  onReset,
  onLeave,
  onSelectGame,
  onChat,
  onDifficulty,
  onThemeToggle,
  theme,
}: Props) {
  const { match, names, seat } = state;
  const adapter = getGame(match.gameId);
  const highlight = match.result.status === 'won' ? match.result.highlight : [];
  const interactive = canControl(state, match.turn);
  const locked = match.result.status !== 'playing' || match.matchOver || !interactive;
  const opponentPresent = state.mode === 'local' ? true : state.conn === 'connected';

  const confettiRef = useConfetti(match.matchOver || match.result.status === 'won');

  const accent = useMemo(
    () => (value: Seat | null) => (value === 'p1' ? P1 : value === 'p2' ? P2 : 'text-muted'),
    [],
  );
  const chatAccent = useMemo(
    () => (value: Seat | 'system') => (value === 'p1' ? P1 : value === 'p2' ? P2 : 'text-accent'),
    [],
  );

  const lastResult = useRef<string>('');
  useEffect(() => {
    const signature = `${match.round}-${match.result.status}`;
    if (signature === lastResult.current) return;
    lastResult.current = signature;
    if (match.result.status === 'won') sound.play('win');
    else if (match.result.status === 'draw') sound.play('draw');
  }, [match.result.status, match.round, sound]);

  const play = (move: Move) => {
    if (locked) return;
    onPlay(move);
    sound.play(match.gameId === 'connect4' ? 'drop' : match.gameId === 'rps' ? 'throw' : 'move');
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 pb-10 pt-5 sm:px-6">
      <canvas ref={confettiRef} className="pointer-events-none fixed inset-0 z-50 h-full w-full" aria-hidden />

      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
          Duel Arena
          <span className="ml-2 text-base font-normal text-muted">{adapter.name}</span>
        </h1>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="btn btn-ghost !min-h-10 !px-3 text-sm"
            onClick={sound.toggle}
            aria-pressed={sound.enabled}
          >
            {sound.enabled ? <Volume2 size={16} aria-hidden /> : <VolumeX size={16} aria-hidden />}
            Sound
          </button>
          <button
            type="button"
            className="btn btn-ghost !min-h-10 !px-3 text-sm"
            onClick={onThemeToggle}
          >
            {theme === 'dark' ? <Sun size={16} aria-hidden /> : <Moon size={16} aria-hidden />}
            Theme
          </button>
        </div>
      </header>

      {state.mode !== 'local' && state.code && (
        <RoomBar
          code={state.code}
          conn={state.conn}
          isHost={state.mode === 'host'}
          onLeave={onLeave}
        />
      )}

      {state.banner && (
        <p className="animate-float-in pill w-fit border-accent text-accent">{state.banner}</p>
      )}

      {state.error && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-p2 bg-p2-tint px-4 py-3 text-sm text-ink">
          <span>{state.error}</span>
          <button type="button" className="btn btn-ghost !min-h-9 !px-3 text-xs" onClick={onLeave}>
            Back to lobby
          </button>
        </div>
      )}

      <ScoreHeader match={match} names={names} mySeat={seat} accent={accent} opponentPresent={opponentPresent} />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <main className="surface-card grid-paper flex flex-col items-center gap-5 rounded-3xl px-4 py-6 sm:px-6">
          {match.gameId === 'tictactoe' && (
            <TicTacToeBoard
              state={match.game as TttState}
              highlight={highlight}
              locked={locked}
              accent={accent}
              onMove={(index) => play(index)}
            />
          )}
          {match.gameId === 'connect4' && (
            <ConnectFourBoard
              state={match.game as C4State}
              highlight={highlight}
              locked={locked}
              accent={accent}
              onMove={(column) => play(column)}
            />
          )}
          {match.gameId === 'rps' && (
            <RpsArena
              state={match.game as RpsState}
              activeSeat={match.turn}
              locked={locked}
              onMove={(choice: Choice) => play(choice)}
              playerLabel={(value) => names[value]}
              accent={accent}
            />
          )}

          {match.result.status !== 'playing' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex w-full flex-col items-center gap-3 border-t border-divider pt-5"
            >
              <p className="text-lg font-semibold text-ink">
                {match.matchOver && match.champion
                  ? `${names[match.champion]} wins the match`
                  : match.result.status === 'won'
                    ? `${names[match.result.winner]} takes round ${match.round}`
                    : 'Round drawn'}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2">
                {!match.matchOver && (
                  <button type="button" className="btn btn-primary" onClick={onNextRound}>
                    <Trophy size={18} aria-hidden /> Next round
                  </button>
                )}
                {match.matchOver && (
                  <>
                    <button type="button" className="btn btn-primary" onClick={onReset}>
                      <RotateCcw size={18} aria-hidden /> Rematch
                    </button>
                    <button type="button" className="btn btn-ghost" onClick={onLeave}>
                      Back to lobby
                    </button>
                  </>
                )}
                {!isAuthoritative(state) && state.pendingRematch.includes(match.turn) && (
                  <span className="text-xs text-muted">Waiting for the host to start round {match.round + 1}</span>
                )}
              </div>
            </motion.div>
          )}

          {match.result.status === 'playing' && !interactive && (
            <p className="text-sm text-muted">
              {match.turn === seat
                ? 'Waiting for the other player…'
                : `Waiting for ${names[match.turn]} to move…`}
            </p>
          )}
        </main>

        <aside className="flex min-h-0 flex-col gap-4">
          <section className="surface-card rounded-2xl p-4">
            <h2 className="text-sm font-semibold text-ink">Switch game</h2>
            <p className="mt-1 text-[11px] text-muted">
              {isAuthoritative(state) ? 'Your choice, applied for both players.' : 'The host picks the game.'}
            </p>
            <div className="mt-3">
              <GamePicker
                compact
                selected={match.gameId}
                onSelect={onSelectGame}
                disabled={!isAuthoritative(state)}
              />
            </div>
          </section>

          {state.mode === 'local' && state.aiSeat && (
            <section className="surface-card rounded-2xl p-4">
              <h2 className="text-sm font-semibold text-ink">Duel Bot</h2>
              <div className="mt-3 flex gap-2">
                {(['casual', 'sharp'] as const).map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => onDifficulty(level)}
                    className={`pill flex-1 ${
                      state.difficulty === level
                        ? 'border-accent bg-accent-tint text-accent'
                        : 'text-muted hover:border-accent'
                    }`}
                    aria-pressed={state.difficulty === level}
                  >
                    {level === 'casual' ? 'Casual' : 'Sharp'}
                  </button>
                ))}
              </div>
            </section>
          )}

          <ChatPanel chat={state.chat} accent={chatAccent} onSend={onChat} />

          <button type="button" className="btn btn-ghost" onClick={onReset}>
            <RefreshCw size={16} aria-hidden /> Reset match
          </button>
        </aside>
      </div>
    </div>
  );
}
