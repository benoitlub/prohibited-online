import { canPlayCard, createGame, dispatchGameAction } from './engine';
import type { CardInstance, GameMode, GameState, Player } from './types';

function preferredOwnSetIndex(player: Player, card?: CardInstance): number {
  if (!card || card.family !== 'product') return 0;
  const freeIndex = player.sets.findIndex(set => set.length === 0);
  return freeIndex >= 0 ? freeIndex : 0;
}

function trySmokeCompleteSet(state: GameState, ai: Player): GameState | null {
  const smoke = ai.hand.find(card => card.cardId === 'smoke_me');
  if (!smoke) return null;

  const ownCompleteIndex = ai.sets.findIndex(set => set.length >= 4);
  if (ownCompleteIndex < 0) return null;

  const next = dispatchGameAction(state, {
    type: 'try_smoke',
    playerId: ai.id,
    targetPlayerId: ai.id,
    targetSetIndex: ownCompleteIndex,
  });

  return next === state ? null : next;
}

function findPlayableCard(state: GameState, ai: Player): { card: CardInstance; targetPlayerId: string; targetSetIndex: number } | null {
  const ownCandidates = ai.hand
    .filter(card => card.family !== 'attack')
    .map(card => ({
      card,
      targetPlayerId: ai.id,
      targetSetIndex: preferredOwnSetIndex(ai, card),
    }))
    .filter(candidate => canPlayCard(state, candidate.card, candidate.targetPlayerId, candidate.targetSetIndex));

  const preferred = ownCandidates.find(candidate => candidate.card.family === 'product')
    ?? ownCandidates.find(candidate => candidate.card.cardId === 'smoke_me')
    ?? ownCandidates[0];

  if (preferred) return preferred;

  const human = state.players.find(player => player.id !== ai.id);
  if (!human) return null;

  for (const card of ai.hand.filter(item => item.family === 'attack')) {
    for (let setIndex = 0; setIndex < human.sets.length; setIndex += 1) {
      if (canPlayCard(state, card, human.id, setIndex)) {
        return { card, targetPlayerId: human.id, targetSetIndex: setIndex };
      }
    }
  }

  return null;
}

function discardFallback(state: GameState, ai: Player): GameState {
  const discard = ai.hand.find(card => card.family === 'attack') ?? ai.hand.at(-1);
  if (!discard) return state;
  return dispatchGameAction(state, { type: 'discard_card', cardInstanceId: discard.instanceId });
}

export function runSoloAiTurn(state: GameState): GameState {
  if (state.status !== 'playing') return state;

  const ai = state.players[state.currentPlayerIndex];
  if (!ai || !ai.id.includes('ai')) return state;

  let next = trySmokeCompleteSet(state, ai) ?? state;

  if (next === state) {
    const playable = findPlayableCard(state, ai);
    next = playable
      ? dispatchGameAction(state, {
          type: 'play_card',
          cardInstanceId: playable.card.instanceId,
          targetPlayerId: playable.targetPlayerId,
          targetSetIndex: playable.targetSetIndex,
        })
      : discardFallback(state, ai);
  }

  if (next.status !== 'playing') return next;
  if (next.currentPlayerIndex !== state.currentPlayerIndex) return next;
  return dispatchGameAction(next, { type: 'end_turn' });
}

export function createSoloAiGame(mode: GameMode, targetScore: number): GameState {
  const game = createGame({ playerCount: 2, mode, targetScore: mode === 'quick' ? 3 : targetScore });
  return {
    ...game,
    config: { ...game.config, playerCount: 2 },
    players: game.players.map((player, index) => index === 1
      ? { ...player, id: 'ai-player-2', name: 'Feuch Bot' }
      : { ...player, name: 'Joueur 1' }),
    tableMessage: 'Mode solo IA actif. Feuch Bot prend la chaise adverse.',
    eventLog: ['Mode solo IA actif. Feuch Bot prend la chaise adverse.', ...game.eventLog].slice(0, 12),
  };
}
