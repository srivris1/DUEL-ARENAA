import { useEffect, useRef, useState } from 'react';
import { useHashRoute } from './hooks/useHashRoute';
import { useSound } from './hooks/useSound';
import { SessionProvider } from './session/SessionContext';
import { useSession } from './session/useSession';
import { Lobby } from './components/Lobby';
import { GameScreen } from './components/GameScreen';

function readTheme(): 'dark' | 'light' {
  if (typeof localStorage === 'undefined') return 'dark';
  return localStorage.getItem('duel-arena:theme') === 'light' ? 'light' : 'dark';
}

function routeKey(route: ReturnType<typeof useHashRoute>): string {
  if (route.view === 'host' || route.view === 'join') return `${route.view}/${route.code}`;
  if (route.view === 'local') return `local/${route.bot ? 'bot' : ''}`;
  return 'menu';
}

function Arena() {
  const session = useSession();
  const route = useHashRoute();
  const sound = useSound();
  const [theme, setTheme] = useState<'dark' | 'light'>(readTheme);
  const { state, host, join, startLocal, leave } = session;
  const key = routeKey(route);
  const handled = useRef<string | null>(null);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('duel-arena:theme', theme);
  }, [theme]);

  useEffect(() => {
    if (handled.current === key) return;
    handled.current = key;
    if (route.view === 'host') host(route.code);
    else if (route.view === 'join') join(route.code);
    else if (route.view === 'local') startLocal(route.bot ? 'p2' : null);
    else leave();
  }, [key, route, host, join, startLocal, leave]);

  if (route.view === 'menu') return <Lobby />;

  return (
    <GameScreen
      state={state}
      sound={sound}
      onPlay={session.play}
      onNextRound={session.nextRound}
      onReset={session.resetMatch}
      onLeave={() => {
        leave();
        window.location.hash = '#/';
      }}
      onSelectGame={session.selectGame}
      onChat={session.sendChat}
      onDifficulty={session.setDifficulty}
      onThemeToggle={() => setTheme((previous) => (previous === 'dark' ? 'light' : 'dark'))}
      theme={theme}
    />
  );
}

export default function App() {
  return (
    <SessionProvider>
      <Arena />
    </SessionProvider>
  );
}
