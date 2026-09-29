import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Bot, Copy, Link2, Sparkles, Users } from 'lucide-react';
import { useSession } from '../session/useSession';
import { normalizeCode, randomCode } from '../net/room';
import { navigate } from '../hooks/useHashRoute';
import { GamePicker } from './GamePicker';
import type { BestOf } from '../games/types';

const BEST_OF_OPTIONS: readonly BestOf[] = [1, 3, 5, 7];

export function Lobby() {
  const { state, playerName, setPlayerName, selectGame, selectBestOf } = useSession();
  const [joinCode, setJoinCode] = useState('');
  const [customCode, setCustomCode] = useState('');

  function createRoom() {
    const code = customCode ? normalizeCode(customCode) : randomCode();
    navigate(`/play/${code}`);
  }

  function joinRoom() {
    const code = normalizeCode(joinCode);
    if (code.length < 4) return;
    navigate(`/join/${code}`);
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 pb-16 pt-8 sm:px-6 lg:px-8">
      <header className="animate-float-in flex flex-col gap-3">
        <span className="pill inline-flex w-fit items-center gap-2 border-accent text-accent">
          <Sparkles size={14} aria-hidden /> Three games · one room code
        </span>
        <h1 className="text-[clamp(2.5rem,7vw,4.5rem)] font-semibold leading-[0.95] tracking-tight text-ink">
          Duel Arena
        </h1>
        <p className="max-w-2xl text-base text-muted sm:text-lg">
          Play Tic-Tac-Toe, Connect Four or Rock Paper Scissors against a friend on another device.
          Create a room, share the code, and go.
        </p>
      </header>

      <section className="surface-card animate-float-in rounded-3xl p-5 sm:p-6">
        <label className="block text-sm font-medium text-muted" htmlFor="player-name">
          Your display name
        </label>
        <input
          id="player-name"
          value={playerName}
          onChange={(event) => setPlayerName(event.target.value)}
          maxLength={18}
          className="mt-2 w-full rounded-xl border border-boundary bg-surface-2 px-4 py-3 text-ink"
          placeholder="Host"
        />
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="surface-card rounded-3xl p-5 sm:p-6"
        >
          <h2 className="flex items-center gap-2 text-lg font-semibold text-ink">
            <Users size={20} className="text-p1" aria-hidden /> Host a live room
          </h2>
          <p className="mt-1 text-sm text-muted">
            You run the game. Your friend joins from any phone or laptop with the code.
          </p>
          <div className="mt-4 flex flex-col gap-3">
            <label className="text-sm font-medium text-muted" htmlFor="custom-code">
              Room code (optional)
            </label>
            <div className="flex gap-2">
              <input
                id="custom-code"
                value={customCode}
                onChange={(event) => setCustomCode(event.target.value.toUpperCase())}
                maxLength={6}
                placeholder="auto"
                className="w-28 rounded-xl border border-boundary bg-surface-2 px-4 py-3 text-center font-semibold tracking-[0.3em] text-ink uppercase"
              />
              <button type="button" className="btn btn-primary flex-1" onClick={createRoom}>
                Create room <ArrowRight size={18} aria-hidden />
              </button>
            </div>
            <p className="text-xs text-muted">
              Share link format: <code className="text-accent">#/join/CODE</code>
            </p>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="surface-card rounded-3xl p-5 sm:p-6"
        >
          <h2 className="flex items-center gap-2 text-lg font-semibold text-ink">
            <Link2 size={20} className="text-p2" aria-hidden /> Join with a code
          </h2>
          <p className="mt-1 text-sm text-muted">Ask your host for the five-letter room code.</p>
          <div className="mt-4 flex gap-2">
            <input
              aria-label="Room code"
              value={joinCode}
              onChange={(event) => setJoinCode(normalizeCode(event.target.value))}
              maxLength={6}
              placeholder="ABCDE"
              className="w-32 rounded-xl border border-boundary bg-surface-2 px-4 py-3 text-center font-semibold tracking-[0.3em] text-ink uppercase"
            />
            <button
              type="button"
              className="btn btn-primary flex-1"
              onClick={joinRoom}
              disabled={joinCode.length < 4}
            >
              Join <ArrowRight size={18} aria-hidden />
            </button>
          </div>
        </motion.section>
      </div>

      <section className="surface-card rounded-3xl p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-ink">Choose your arena</h2>
        <p className="mt-1 text-sm text-muted">
          You can switch games any time. Both players see the same board.
        </p>
        <div className="mt-4">
          <GamePicker selected={state.match.gameId} onSelect={selectGame} />
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium text-muted">Match length</span>
          {BEST_OF_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => selectBestOf(option)}
              className={`pill transition-colors ${
                state.match.bestOf === option
                  ? 'border-accent bg-accent-tint text-accent'
                  : 'text-muted hover:border-accent'
              }`}
              aria-pressed={state.match.bestOf === option}
            >
              Best of {option}
            </button>
          ))}
        </div>
      </section>

      <section className="grid gap-5 sm:grid-cols-2">
        <motion.button
          type="button"
          onClick={() => {
            navigate('/local');
          }}          whileHover={{ y: -3 }}
          className="surface-card rounded-3xl p-5 text-left"
        >
          <h3 className="flex items-center gap-2 font-semibold text-ink">
            <Copy size={18} className="text-accent" aria-hidden /> Pass &amp; play
          </h3>
          <p className="mt-1 text-sm text-muted">Two players, one screen, no internet needed.</p>
        </motion.button>
        <motion.button
          type="button"
          onClick={() => {
            navigate('/local/bot');
          }}
          whileHover={{ y: -3 }}
          className="surface-card rounded-3xl p-5 text-left"
        >
          <h3 className="flex items-center gap-2 font-semibold text-ink">
            <Bot size={18} className="text-p1" aria-hidden /> Train vs Duel Bot
          </h3>
          <p className="mt-1 text-sm text-muted">Practice against a minimax opponent offline.</p>
        </motion.button>
      </section>
    </div>
  );
}
