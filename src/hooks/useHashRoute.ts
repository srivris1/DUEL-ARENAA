import { useEffect, useState } from 'react';

export type Route =
  | { readonly view: 'menu' }
  | { readonly view: 'host'; readonly code: string }
  | { readonly view: 'join'; readonly code: string }
  | { readonly view: 'local'; readonly bot: boolean };

function parse(hash: string): Route {
  const clean = hash.replace(/^#\/?/, '').trim();
  if (!clean) return { view: 'menu' };
  const [path, rawCode] = clean.split('/');
  if (path === 'local') return { view: 'local', bot: rawCode === 'bot' };
  if (path === 'play' && rawCode) return { view: 'host', code: rawCode.toUpperCase() };
  if (path === 'join' && rawCode) return { view: 'join', code: rawCode.toUpperCase() };
  return { view: 'menu' };
}

export function useHashRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parse(window.location.hash));

  useEffect(() => {
    const onChange = () => setRoute(parse(window.location.hash));
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);

  return route;
}

export function navigate(path: string): void {
  const next = path.startsWith('#') ? path : `#${path}`;
  if (window.location.hash === next) return;
  window.location.hash = next;
}
