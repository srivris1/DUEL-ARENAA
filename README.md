# Duel Arena

Three games, one room code, two devices. Play **Tic-Tac-Toe**, **Connect Four** and **Rock
Paper Scissors** live against a friend on another phone or laptop, or on the same screen.

No accounts, no database, no build step for players. The host runs the game; the guest's moves
travel over a WebRTC data channel, so the game state never touches a game server.

## Features

- **Live multiplayer over WebRTC** — create a room, share a five-letter code or a link, play.
- **Three games** with correct rules, turn handling, win detection and restart flow.
- **Best of 1 / 3 / 5 / 7** match scoring kept inside the reducer, plus round history.
- **Pass & play** on one device, and **Duel Bot** (minimax) for offline practice.
- **Live chat and emoji trash talk** relayed through the host.
- Animated boards, confetti on a match win, WebAudio sound effects, dark/light themes,
  copy-link and native share, responsive layout, keyboard accessible, reduced-motion aware.

## Quick start

```bash
npm install
npm run dev
```

Open the printed URL, press **Create room**, and send the `.../#/join/CODE` link to a friend.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Dev server on <http://127.0.0.1:5180> |
| `npm run build` | Type-check and build to `dist/` |
| `npm run preview` | Serve the production build on <http://127.0.0.1:4180> |
| `npm run lint` | oxlint |
| `npm run typecheck` | `tsc -b` |
| `npm test` | Vitest unit and component tests |
| `npm run test:e2e` | Playwright end-to-end tests (also starts the local signalling server) |

## Architecture

```
src/
  games/      pure rules + match reducer (tictactoe, connect4, rps, ai)
  net/        PeerJS room wrapper and the host/guest message protocol
  session/    session reducer + the hook that owns rooms, chat and the bot
  components/ lobby, game screen, boards, chat, score header
  hooks/      hash routing, sound, confetti
server/       optional self-hosted PeerJS signalling server
```

- Rules are pure functions with no React or network imports.
- `matchReducer` is the only place that mutates game state, including scores.
- The host is authoritative: guests send intents, the host applies them and broadcasts snapshots.

## Signalling server

PeerJS needs a small signalling server to introduce two browsers to each other. The app uses the
free public PeerJS cloud by default. Some networks (campus and office Wi-Fi, for example) block
it, and live play will not connect.

A self-hosted server is included:

```bash
cd server
npm install
npm start          # http://0.0.0.0:9000/duel-arena
```

`render.yaml` deploys it to Render in one click. Then point the app at it, either at build time:

```bash
VITE_PEER_HOST=your-signal-server.example.com
VITE_PEER_PORT=443
VITE_PEER_PATH=/duel-arena
VITE_PEER_KEY=the-key-you-set
VITE_PEER_SECURE=true
```

or at runtime, without rebuilding, by defining a global before the app script loads:

```html
<script>
  window.__DUEL_SIGNAL__ = {
    host: 'your-signal-server.example.com',
    port: 443,
    path: '/duel-arena',
    key: 'the-key-you-set',
    secure: true,
  };
</script>
```

Copy `.env.example` to `.env` for local development.

The server only brokers the handshake. Game moves go directly between the two browsers.

## Deployment

The GitHub Actions workflow in `.github/workflows/deploy.yml` lints, type-checks, tests, builds and
publishes to GitHub Pages. Set the repository's Pages source to **GitHub Actions**, and make sure
`vite.config.ts` `base` matches the repository name.

## Testing notes

- Unit and component tests: `npm test` (jsdom).
- End-to-end: `npm run test:e2e`. It starts the preview server and the local signalling server, then
  drives two isolated browser contexts through a full live game, so multiplayer is verified for real
  rather than mocked.
