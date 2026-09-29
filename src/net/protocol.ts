import type { BestOf, GameId, MatchState, Seat } from '../games/types';

export type ChatLine = {
  readonly id: string;
  readonly seat: Seat | 'system';
  readonly author: string;
  readonly text: string;
  readonly at: number;
};

export type ClientMessage =
  | { readonly t: 'hello'; readonly name: string }
  | { readonly t: 'move'; readonly move: number | string }
  | { readonly t: 'chat'; readonly text: string; readonly id: string }
  | { readonly t: 'emote'; readonly emoji: string }
  | { readonly t: 'nextRound' }
  | { readonly t: 'reset' }
  | { readonly t: 'setGame'; readonly gameId: GameId }
  | { readonly t: 'setBestOf'; readonly bestOf: BestOf };

export type ServerMessage =
  | {
      readonly t: 'welcome';
      readonly seat: Seat;
      readonly state: MatchState;
      readonly names: Record<Seat, string>;
      readonly chat: readonly ChatLine[];
      readonly settings: { readonly bestOf: BestOf };
    }
  | { readonly t: 'state'; readonly state: MatchState; readonly chat?: readonly ChatLine[] }
  | { readonly t: 'chatAdded'; readonly line: ChatLine }
  | { readonly t: 'names'; readonly names: Record<Seat, string> }
  | { readonly t: 'notice'; readonly text: string }
  | { readonly t: 'opponentLeft' }
  | { readonly t: 'error'; readonly message: string };

export type WireMessage = ClientMessage | ServerMessage;
