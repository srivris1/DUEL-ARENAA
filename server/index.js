import express from 'express';
import { ExpressPeerServer } from 'peer';

const PORT = Number(process.env.PORT ?? 9000);
const PATH = process.env.PEER_PATH ?? '/duel-arena';
const KEY = process.env.PEER_KEY ?? 'duel-arena-key';

const app = express();
const server = app.listen(PORT, () => {
  console.log(`Duel Arena signalling server on http://0.0.0.0:${PORT}${PATH} (key: ${KEY})`);
});

app.use('/', ExpressPeerServer(server, { path: PATH, key: KEY, allow_discovery: false }));
app.get('/health', (_request, response) => {
  response.json({ ok: true });
});
