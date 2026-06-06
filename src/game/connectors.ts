import { createGame, dispatchGameAction } from './engine';
import type { GameAction, GameConfig, GameState } from './types';

export type RoomId = string;
export type SeatId = `player-${1 | 2 | 3 | 4 | 5}`;
export type ConnectorKind = 'offline' | 'firebase-dormant' | 'netlify-dormant';

export type RoomSnapshot = {
  roomId: RoomId;
  kind: ConnectorKind;
  state: GameState;
  localSeatId: SeatId;
 