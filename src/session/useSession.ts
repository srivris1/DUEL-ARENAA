import { useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { pickAiMove } from '../games/ai';
import type { Difficulty } from '../games/ai';
import type { MatchAction } from '../games/match';
import type { BestOf, GameId, Move, Seat } from '../games/types';
import { hostRoom, joinRoom, randomCode } from '../net/room';
import type { Room } from '../net/room';
import { SessionContext } from './context';
import type { ChatLine, ClientMessage, ServerMessage, WireMessage } from '../net/protocol';
import {
  createSessionState,
  isAuthoritative,
  sessionReducer,
} from './sessionReducer';
import type { SessionState } from './sessionReducer';

const AI_DELAY_MS = 550;

function makeId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function readStoredName(): string {
  if (typeof localStorage === 'undefined') return 'Host';
  return localStorage.getItem('duel-arena:name') ?? 'Host';
}

function persistName(name: string): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem('duel-arena:name', name);
}

export type SessionValue = {
  state: SessionState;
  playerName: string;
  setPlayerName: (name: string) => void;
  host: (code?: string) => void;
  join: (code: string) => void;
  startLocal: (aiSeat: Seat | null) => void;
  leave: () => void;
  play: (move: Move) => void;
  nextRound: () => void;
  resetMatch: () => void;
  selectGame: (gameId: GameId) => void;
  selectBestOf: (bestOf: BestOf) => void;
  setDifficulty: (difficulty: Difficulty) => void;
  sendChat: (text: string) => void;
  dismissError: () => void;
};

export function useSessionValue(): SessionValue {
  const [state, dispatch] = useReducer(sessionReducer, undefined, () => createSessionState());
  const [playerName, setNameState] = useState(readStoredName);
  const roomRef = useRef<Room | null>(null);
  const sentRef = useRef<{ match: SessionState['match']; chat: unknown } | null>(null);
  const stateRef = useRef(state);
  const currentNamesRef = useRef(state.names);
  const currentSeatRef = useRef(state.seat);

  useEffect(() => {
    stateRef.current = state;
    currentNamesRef.current = state.names;
    currentSeatRef.current = state.seat;
  });

  const setPlayerName = useCallback((name: string) => {
    const trimmed = name.trim().slice(0, 18) || 'Player';
    setNameState(trimmed);
    persistName(trimmed);
    dispatch({
      type: 'setNames',
      names: { ...currentNamesRef.current, [currentSeatRef.current]: trimmed },
    });
  }, []);

  const applyLocal = useCallback((action: MatchAction) => {
    dispatch({ type: 'applyMatch', action });
  }, []);

  const addChat = useCallback((line: ChatLine) => {
    dispatch({ type: 'addChat', line });
  }, []);

  const pushChat = useCallback(
    (seat: Seat, author: string, text: string) => {
      addChat({ id: makeId(), seat, author, text, at: Date.now() });
    },
    [addChat],
  );

  const handleClientMessage = useCallback(
    (message: WireMessage) => {
      const snapshot = stateRef.current;
      switch (message.t) {
        case 'hello': {
          const author = message.name.trim().slice(0, 18) || 'Guest';
          dispatch({
            type: 'setNames',
            names: { ...snapshot.names, p2: author },
          });
          dispatch({ type: 'banner', text: `${author} joined the room` });
          break;
        }
        case 'move':
          applyLocal({ type: 'PLAY', move: message.move, seat: 'p2' });
          break;
        case 'chat':
          pushChat('p2', snapshot.names.p2, message.text);
          break;
        case 'emote':
          pushChat('p2', snapshot.names.p2, message.emoji);
          break;
        case 'nextRound':
          dispatch({ type: 'rematchRequest', seat: 'p2' });
          applyLocal({ type: 'NEXT_ROUND' });
          break;
        case 'reset':
          applyLocal({ type: 'RESET' });
          break;
        case 'setGame':
          applyLocal({ type: 'SET_GAME', gameId: message.gameId });
          break;
        case 'setBestOf':
          applyLocal({ type: 'SET_BEST_OF', bestOf: message.bestOf });
          break;
        default:
          break;
      }
    },
    [applyLocal, pushChat],
  );

  const handleServerMessage = useCallback((message: WireMessage) => {
    switch (message.t) {
      case 'welcome':
        dispatch({ type: 'remoteState', state: message.state, chat: message.chat });
        dispatch({ type: 'setNames', names: message.names });
        dispatch({ type: 'conn', status: 'connected' });
        break;
      case 'state':
        dispatch({ type: 'remoteState', state: message.state, chat: message.chat });
        break;
      case 'chatAdded':
        dispatch({ type: 'addChat', line: message.line });
        break;
      case 'names':
        dispatch({ type: 'setNames', names: message.names });
        break;
      case 'notice':
        dispatch({ type: 'banner', text: message.text });
        break;
      case 'opponentLeft':
        dispatch({ type: 'conn', status: 'waiting' });
        dispatch({ type: 'banner', text: 'Opponent left the room' });
        break;
      case 'error':
        dispatch({ type: 'error', message: message.message });
        break;
      default:
        break;
    }
  }, []);

  const closeRoom = useCallback(() => {
    roomRef.current?.close();
    roomRef.current = null;
    sentRef.current = null;
  }, []);

  const host = useCallback(
    (code?: string) => {
      closeRoom();
      const roomCode = (code ?? randomCode()).toUpperCase();
      dispatch({
        type: 'setMode',
        mode: 'host',
        code: roomCode,
        seat: 'p1',
      });
      dispatch({ type: 'setNames', names: { p1: playerName, p2: 'Waiting…' } });
      roomRef.current = hostRoom(roomCode, {
        onStatus: (status) => dispatch({ type: 'conn', status }),
        onMessage: handleClientMessage,
        onPeerConnected: (connection) => {
          dispatch({ type: 'conn', status: 'connected' });
          connection.send({
            t: 'welcome',
            seat: 'p2',
            state: stateRef.current.match,
            names: { p1: playerName, p2: 'Waiting…' },
            chat: stateRef.current.chat,
            settings: { bestOf: stateRef.current.match.bestOf },
          } satisfies ServerMessage);
        },
        onPeerDisconnected: () => {
          dispatch({ type: 'conn', status: 'waiting' });
          dispatch({ type: 'banner', text: 'Opponent left the room' });
        },
        onError: (message) => dispatch({ type: 'error', message }),
      });
      dispatch({ type: 'conn', status: 'connecting' });
    },
    [closeRoom, handleClientMessage, playerName],
  );

  const join = useCallback(
    (code: string) => {
      closeRoom();
      const roomCode = code.toUpperCase();
      dispatch({ type: 'setMode', mode: 'guest', code: roomCode, seat: 'p2' });
      dispatch({ type: 'setNames', names: { p1: 'Host', p2: playerName } });
      dispatch({ type: 'conn', status: 'connecting' });
      roomRef.current = joinRoom(roomCode, {
        onStatus: (status) => dispatch({ type: 'conn', status }),
        onMessage: handleServerMessage,
        onPeerConnected: () => undefined,
        onPeerDisconnected: () => dispatch({ type: 'conn', status: 'closed' }),
        onError: (message) => dispatch({ type: 'error', message }),
      });
      window.setTimeout(() => {
        roomRef.current?.send({ t: 'hello', name: playerName } satisfies ClientMessage);
      }, 900);
    },
    [closeRoom, handleServerMessage, playerName],
  );

  const startLocal = useCallback(
    (aiSeat: Seat | null) => {
      closeRoom();
      dispatch({ type: 'setMode', mode: 'local' });
      dispatch({ type: 'setAi', seat: aiSeat });
      dispatch({
        type: 'setNames',
        names: aiSeat ? { p1: 'You', p2: 'Duel Bot' } : { p1: 'Player 1', p2: 'Player 2' },
      });
    },
    [closeRoom],
  );

  const leave = useCallback(() => {
    closeRoom();
    dispatch({ type: 'setMode', mode: 'menu' });
  }, [closeRoom]);

  const play = useCallback(
    (move: Move) => {
      const snapshot = stateRef.current;
      if (!isAuthoritative(snapshot)) {
        roomRef.current?.send({ t: 'move', move } satisfies ClientMessage);
        return;
      }
      applyLocal({ type: 'PLAY', move, seat: snapshot.match.turn });
    },
    [applyLocal],
  );

  const nextRound = useCallback(() => {
    const snapshot = stateRef.current;
    dispatch({ type: 'rematchRequest', seat: snapshot.seat });
    if (!isAuthoritative(snapshot)) {
      roomRef.current?.send({ t: 'nextRound' } satisfies ClientMessage);
      return;
    }
    applyLocal({ type: 'NEXT_ROUND' });
  }, [applyLocal]);

  const resetMatch = useCallback(() => {
    const snapshot = stateRef.current;
    if (!isAuthoritative(snapshot)) {
      roomRef.current?.send({ t: 'reset' } satisfies ClientMessage);
      return;
    }
    applyLocal({ type: 'RESET' });
  }, [applyLocal]);

  const selectGame = useCallback(
    (gameId: GameId) => {
      const snapshot = stateRef.current;
      if (snapshot.mode === 'guest') {
        roomRef.current?.send({ t: 'setGame', gameId } satisfies ClientMessage);
        return;
      }
      applyLocal({ type: 'SET_GAME', gameId });
    },
    [applyLocal],
  );

  const selectBestOf = useCallback(
    (bestOf: BestOf) => {
      const snapshot = stateRef.current;
      if (snapshot.mode === 'guest') {
        roomRef.current?.send({ t: 'setBestOf', bestOf } satisfies ClientMessage);
        return;
      }
      applyLocal({ type: 'SET_BEST_OF', bestOf });
    },
    [applyLocal],
  );

  const setDifficulty = useCallback((difficulty: Difficulty) => {
    dispatch({ type: 'setDifficulty', difficulty });
  }, []);

  const sendChat = useCallback(
    (text: string) => {
      const trimmed = text.trim().slice(0, 160);
      if (!trimmed) return;
      const snapshot = stateRef.current;
      if (!isAuthoritative(snapshot)) {
        roomRef.current?.send({ t: 'chat', text: trimmed, id: makeId() } satisfies ClientMessage);
        return;
      }
      pushChat(snapshot.seat, snapshot.names[snapshot.seat], trimmed);
    },
    [pushChat],
  );

  const dismissError = useCallback(() => dispatch({ type: 'error', message: null }), []);

  useEffect(() => {
    if (state.mode !== 'host') return;
    if (sentRef.current?.match === state.match) return;
    sentRef.current = { match: state.match, chat: state.chat };
    roomRef.current?.send({ t: 'state', state: state.match, chat: state.chat } satisfies ServerMessage);
  }, [state.mode, state.match, state.chat]);

  useEffect(() => {
    const aiSeat = state.aiSeat;
    if (state.mode !== 'local' || !aiSeat) return;
    if (state.match.turn !== aiSeat || state.match.result.status !== 'playing') return;
    const snapshot = state.match;
    const timer = window.setTimeout(() => {
      const move = pickAiMove(snapshot.gameId, snapshot.game, aiSeat, state.difficulty);
      if (move === null) return;
      dispatch({ type: 'applyMatch', action: { type: 'PLAY', move, seat: aiSeat } });
    }, AI_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [state.mode, state.aiSeat, state.difficulty, state.match]);

  useEffect(() => {
    const banner = state.banner;
    if (!banner) return;
    const timer = window.setTimeout(() => dispatch({ type: 'banner', text: null }), 4000);
    return () => window.clearTimeout(timer);
  }, [state.banner]);

  useEffect(() => () => closeRoom(), [closeRoom]);

  const value = useMemo<SessionValue>(
    () => ({
      state,
      playerName,
      setPlayerName,
      host,
      join,
      startLocal,
      leave,
      play,
      nextRound,
      resetMatch,
      selectGame,
      selectBestOf,
      setDifficulty,
      sendChat,
      dismissError,
    }),
    [
      state,
      playerName,
      setPlayerName,
      host,
      join,
      startLocal,
      leave,
      play,
      nextRound,
      resetMatch,
      selectGame,
      selectBestOf,
      setDifficulty,
      sendChat,
      dismissError,
    ],
  );

  return value;
}

export function useSession(): SessionValue {
  const value = useContext(SessionContext);
  if (!value) throw new Error('useSession must be used inside SessionProvider');
  return value;
}
