import { canPlayCard, dispatchGameAction } from './engine';
import type { CardInstance, GameState, Player } from './types';

function finishAiStep(previous: GameState, next: GameState): GameState {
  if (next.status !== 'playing') return next;
  if (next.currentPlayerIndex !== previous.currentPlayerIndex) return next;
  return dispatchGameAction(next, { type: 'end_turn' });
}

function preferredOwnSetIndex(player: Player, card?: CardInstance): number {
  if