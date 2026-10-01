import Peer from 'peerjs';
import type { DataConnection } from 'peerjs';
import type { WireMessage } from './protocol';

export type RoomStatus = 'connecting' | 'waiting' | 'connected' | 'closed' | 'failed';

export type RoomError = {
  readonly type: string;
  readonly message: string;
};

export type RoomHandlers = {
  onStatus: (status: RoomStatus) => void;
  onMessage: (message: WireMessage) => void;
  onPeerConnected: (connection: DataConnection) => void;
  onPeerDisconnected: () => void;
  onError: (error: RoomError) => void;
};

export type Room = {
  readonly code: string;
  send: (payload: unknown) => void;
  close: () => void;
};

const PREFIX = 'duelarena-';
const CONNECT_TIMEOUT_MS = 15000;

type SignalConfig = {
  host?: string;
  port?: number;
  path?: string;
  key?: string;
  secure?: boolean;
};

declare global {
  interface Window {
    __DUEL_SIGNAL__?: SignalConfig;
  }
}

function broker(): SignalConfig {
  const env = import.meta.env;
  const runtime = typeof window === 'undefined' ? undefined : window.__DUEL_SIGNAL__;
  const host = runtime?.host ?? env.VITE_PEER_HOST;
  if (!host) return { secure: true };
  return {
    host,
    port: Number(runtime?.port ?? env.VITE_PEER_PORT ?? 443),
    path: runtime?.path ?? env.VITE_PEER_PATH ?? '/duel-arena',
    key: runtime?.key ?? env.VITE_PEER_KEY ?? 'duel-arena-key',
    secure: runtime?.secure ?? env.VITE_PEER_SECURE !== 'false',
  };
}

export function normalizeCode(raw: string): string {
  return raw
    .toUpperCase()
    .split('')
    .filter((character) => /[A-Z0-9]/.test(character))
    .filter((character) => !'IO01'.includes(character))
    .join('')
    .slice(0, 6);
}

export function randomCode(length = 5): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  const values = new Uint32Array(length);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(values);
  } else {
    for (let index = 0; index < length; index += 1) values[index] = Math.floor(Math.random() * 2 ** 32);
  }
  for (let index = 0; index < length; index += 1) {
    code += alphabet[values[index] % alphabet.length];
  }
  return code;
}

function describeError(error: { type?: string; message?: string }): string {
  switch (error.type) {
    case 'unavailable-id':
      return 'That room code is already taken. Try another one.';
    case 'peer-unavailable':
      return 'No room with that code. Check the code and try again.';
    case 'network':
      return 'Cannot reach the connection server. Check your internet and retry.';
    case 'browser-incompatible':
      return 'This browser cannot make peer connections.';
    default:
      return error.message ?? 'Something went wrong while connecting.';
  }
}

function attach(peer: Peer, handlers: RoomHandlers, timeoutMs: number): void {
  peer.on('error', (rawError) => {
    const errorObj = (rawError || {}) as { type?: string; message?: string };
    const type = errorObj.type ?? 'unknown';
    handlers.onError({ type, message: describeError(errorObj) });
    handlers.onStatus('failed');
  });

  if (timeoutMs <= 0) return;

  const timer = setTimeout(() => {
    if (!peer.open) {
      handlers.onError({
        type: 'network',
        message:
          'Connection timed out. The signalling server may be blocked on this network — try another network or host your own server.',
      });
      handlers.onStatus('failed');
    }
  }, timeoutMs);

  peer.on('open', () => clearTimeout(timer));
}

export function hostRoom(code: string, handlers: RoomHandlers): Room {
  const peer = new Peer(`${PREFIX}${code.toLowerCase()}`, { debug: 0, ...broker() });
  let connection: DataConnection | null = null;

  attach(peer, handlers, 0);

  peer.on('open', () => handlers.onStatus('waiting'));
  peer.on('connection', (incoming) => {
    connection = incoming;
    incoming.on('open', () => {
      handlers.onStatus('connected');
      handlers.onPeerConnected(incoming);
    });
    incoming.on('data', (payload) => handlers.onMessage(payload as WireMessage));
    incoming.on('close', () => {
      connection = null;
      handlers.onStatus('waiting');
      handlers.onPeerDisconnected();
    });
    incoming.on('error', (rawError) => {
      const errorObj = (rawError || {}) as { type?: string; message?: string };
      handlers.onError({
        type: errorObj.type ?? 'unknown',
        message: errorObj.message ?? 'Connection error',
      });
    });
  });

  return {
    code,
    send: (payload) => connection?.send(payload),
    close: () => {
      connection?.close();
      peer.destroy();
      handlers.onStatus('closed');
    },
  };
}

export function joinRoom(code: string, handlers: RoomHandlers): Room {
  const peer = new Peer({ debug: 0, ...broker() });
  let connection: DataConnection | null = null;

  attach(peer, handlers, CONNECT_TIMEOUT_MS);

  peer.on('open', () => {
    connection = peer.connect(`${PREFIX}${code.toLowerCase()}`, {
      reliable: true,
      serialization: 'json',
    });
    connection.on('open', () => {
      handlers.onStatus('connected');
      if (connection) {
        handlers.onPeerConnected(connection);
      }
    });
    connection.on('data', (payload) => handlers.onMessage(payload as WireMessage));
    connection.on('close', () => handlers.onStatus('closed'));
    connection.on('error', (rawError) => {
      const errorObj = (rawError || {}) as { type?: string; message?: string };
      handlers.onError({
        type: errorObj.type ?? 'unknown',
        message: errorObj.message ?? 'Connection error',
      });
    });
  });

  return {
    code,
    send: (payload) => connection?.send(payload),
    close: () => {
      connection?.close();
      peer.destroy();
      handlers.onStatus('closed');
    },
  };
}
