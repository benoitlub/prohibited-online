import type { GameState, SetCard } from './types';
import { canCopsDestroy, isResistant, isSetComplete } from './rules';

export function applyWindOrRain(set: SetCard[]): SetCard[] {
  if (set.length === 0) return set;
  const next = [...set];
  const index = next.length - 1;
  const target = next[index];

  if (isResistant(target.cardId)) {
    const updated = { ...target, attackMarks: target.attackMarks + 1 };
    if (updated.attackMarks >= 2) next.splice(index, 1);
    else next[index] = updated;
    return next;
  }

  next.splice(index, 1);
  return next;
}

export function applyLost(): SetCard[] {
  return [];
}

export function applyCops(set: SetCard[]): SetCard[] {
  return canCopsDestroy(set) ? [] : set;
}

export function nextTurn(state: GameState): GameState {
  return {
    ...state,
    currentPlayerIndex: (state.currentPlayerIndex + 1) % state.players.length,
    turnNumber: state.turnNumber + 1,
    playedThisTurn: 0,
  };
}

export function trySmoke(state: GameState, playerId: string): GameState {
  const player = state.players.find(p => p.id === playerId);
  if (!player) return state;

  if (!isSetComplete(player.set)) {
    return { ...state, eventLog: ['HERE, WE DON’T SMOKE. IT’S PRO.HIBITED.', ...state.eventLog] };
  }

  return {
    ...state,
    status: 'finished',
    winnerId: playerId,
    players: state.players.map(p => p.id === playerId ? { ...p, isJunky: true, score: p.score + 1 } : p),
    eventLog: [`${player.name} breached prohibition. Junky unlocked.`, ...state.eventLog],
  };
}
