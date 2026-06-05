import { createDeck, dealCards, shuffleDeck } from './deck';
import { canCopsDestroy, canPlayCard, getSetProduct, isResistant, isSetComplete, scoreSet } from './rules';
import type { CardInstance, GameAction, GameConfig, GameState, Player, SetCard, SetSlot } from './types';

const HAND_SIZE = 5;
const MAX_DISCARDS_PER_TURN = 2;
const SET_SLOTS_PER_PLAYER = 3;

function clampPlayerCount(playerCount: number): number {
  return Math.min(5, Math.max(2, playerCount));
}

function normalizeConfig(config: Partial<GameConfig>): GameConfig {
  const mode = config.mode ?? 'quick';
  return {
    playerCount: clampPlayerCount(config.playerCount ?? 2),
    mode,
    targetScore: mode === 'quick' ? 3 : config.targetScore ?? 30,
  };
}

function createEmptySets(): SetSlot[] {
  return Array.from({ length: SET_SLOTS_PER_PLAYER }, () => []);
}

function createPlayers(playerCount: number): Player[] {
  return Array.from({ length: playerCount }, (_, index) => ({
    id: `player-${index + 1}`,
    name: `Joueur ${index + 1}`,
    hand: [],
    sets: createEmptySets(),
    isJunky: false,
    score: 0,
  }));
}

function clonePlayers(players: Player[]): Player[] {
  return players.map(player => ({
    ...player,
    hand: [...player.hand],
    sets: player.sets.map(set => [...set]),
  }));
}

function toSetCard(card: CardInstance, playedOrder: number): SetCard {
  return {
    instanceId: card.instanceId,
    cardId: card.cardId,
    name: card.name,
    family: card.family,
    attackMarks: 0,
    playedOrder,
  };
}

function toDiscardCard(card: SetCard): CardInstance {
  return {
    instanceId: card.instanceId,
    cardId: card.cardId,
    name: card.name,
    family: card.family,
    effect: 'Carte validee dans un set.',
    countMvp: 1,
  };
}

function withoutCard(hand: CardInstance[], cardInstanceId: string): { hand: CardInstance[]; card?: CardInstance } {
  const card = hand.find(item => item.instanceId === cardInstanceId);
  return { card, hand: hand.filter(item => item.instanceId !== cardInstanceId) };
}

function normalizeSetIndex(player: Player, targetSetIndex = 0): number {
  if (targetSetIndex < 0 || targetSetIndex >= player.sets.length) return 0;
  return targetSetIndex;
}

function drawOne(deck: CardInstance[], discardPile: CardInstance[]): { card?: CardInstance; deck: CardInstance[]; discardPile: CardInstance[] } {
  const nextDeck = [...deck];
  const nextDiscard = [...discardPile];

  if (nextDeck.length === 0 && nextDiscard.length > 0) {
    nextDeck.push(...shuffleDeck(nextDiscard));
    nextDiscard.length = 0;
  }

  return { card: nextDeck.shift(), deck: nextDeck, discardPile: nextDiscard };
}

function refillHand(player: Player, deck: CardInstance[], discardPile: CardInstance[]): { player: Player; deck: CardInstance[]; discardPile: CardInstance[]; drawn: number } {
  const nextPlayer = { ...player, hand: [...player.hand], sets: player.sets.map(set => [...set]) };
  let nextDeck = [...deck];
  let nextDiscard = [...discardPile];
  let drawn = 0;

  while (nextPlayer.hand.length < HAND_SIZE) {
    const draw = drawOne(nextDeck, nextDiscard);
    if (!draw.card) break;
    nextPlayer.hand.push(draw.card);
    nextDeck = draw.deck;
    nextDiscard = draw.discardPile;
    drawn += 1;
  }

  return { player: nextPlayer, deck: nextDeck, discardPile: nextDiscard, drawn };
}

function prependLog(state: GameState, message: string, tableMessage = message): GameState {
  return {
    ...state,
    tableMessage,
    eventLog: [message, ...state.eventLog].slice(0, 12),
  };
}

export function createGame(configInput: Partial<GameConfig>): GameState {
  const config = normalizeConfig(configInput);
  const deck = shuffleDeck(createDeck());
  const players = createPlayers(config.playerCount);
  const dealt = dealCards(players, deck, HAND_SIZE);

  return {
    config,
    players: dealt.players,
    deck: dealt.deck,
    discardPile: [],
    currentPlayerIndex: 0,
    turnNumber: 1,
    playedThisTurn: 0,
    discardedThisTurn: 0,
    nextPlayedOrder: 1,
    status: 'playing',
    eventLog: ['La table est ouverte. Trois slots, zero excuse.'],
    tableMessage: 'HERE, WE DON\'T SMOKE. IT\'S PRO.HIBITED.',
  };
}

export function applyWindOrRain(set: SetCard[]): SetCard[] {
  if (set.length === 0) return set;
  const next = [...set].sort((a, b) => a.playedOrder - b.playedOrder);
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

export function playCard(state: GameState, cardInstanceId: string, targetPlayerId?: string, targetSetIndex = 0): GameState {
  if (state.status !== 'playing') return state;

  const activePlayer = state.players[state.currentPlayerIndex];
  const { card } = withoutCard(activePlayer.hand, cardInstanceId);
  const targetPlayer = targetPlayerId ? state.players.find(player => player.id === targetPlayerId) : activePlayer;
  const targetIndex = targetPlayer ? normalizeSetIndex(targetPlayer, targetSetIndex) : 0;

  if (!card || !targetPlayer || !canPlayCard(state, card, targetPlayer.id, targetIndex)) {
    return prependLog(state, 'Still Pro.Hibited.', 'Still Pro.Hibited.');
  }

  if (card.cardId === 'smoke_me') return trySmoke(state, activePlayer.id, card.instanceId, targetPlayer.id, targetIndex);

  const players = clonePlayers(state.players);
  const current = players[state.currentPlayerIndex];
  const removed = withoutCard(current.hand, cardInstanceId);
  current.hand = removed.hand;

  let message = `${current.name} pose ${card.name} sur son slot ${targetIndex + 1}. Le plan se complique.`;

  if (card.family === 'attack') {
    const target = players.find(player => player.id === targetPlayer.id);
    if (!target) return state;
    const attackedSetIndex = normalizeSetIndex(target, targetIndex);
    const attackedSet = target.sets[attackedSetIndex];

    if (card.cardId === 'wind' || card.cardId === 'rain') {
      const before = attackedSet.length;
      target.sets[attackedSetIndex] = applyWindOrRain(attackedSet);
      message = before === target.sets[attackedSetIndex].length
        ? `${current.name} envoie ${card.name} sur ${target.name} slot ${attackedSetIndex + 1}. Ca resiste, mais ca tremble.`
        : `${current.name} envoie ${card.name} sur ${target.name} slot ${attackedSetIndex + 1}. Derniere carte ejectee.`;
    }

    if (card.cardId === 'lost') {
      target.sets[attackedSetIndex] = applyLost();
      message = `${current.name} joue Lost. ${target.name} perd le slot ${attackedSetIndex + 1}.`;
    }

    if (card.cardId === 'cops') {
      const product = getSetProduct(attackedSet);
      target.sets[attackedSetIndex] = applyCops(attackedSet);
      message = product === 'cbd'
        ? `${current.name} appelle Cops sur le slot ${attackedSetIndex + 1}. CBD presente ses papiers, aucun effet.`
        : `${current.name} appelle Cops. Le slot ${attackedSetIndex + 1} de ${target.name} part au poste.`;
    }
  } else {
    const receiver = players.find(player => player.id === targetPlayer.id);
    if (!receiver) return state;
    receiver.sets[targetIndex] = [...receiver.sets[targetIndex], toSetCard(card, state.nextPlayedOrder)];
    message = receiver.id === current.id
      ? `${current.name} pose ${card.name} sur son slot ${targetIndex + 1}. Le plan se complique.`
      : `${current.name} le Junky pose ${card.name} chez ${receiver.name} slot ${targetIndex + 1}. Association suspecte.`;
  }

  return prependLog({
    ...state,
    players,
    discardPile: card.family === 'attack' ? [card, ...state.discardPile] : state.discardPile,
    playedThisTurn: state.playedThisTurn + 1,
    nextPlayedOrder: state.nextPlayedOrder + 1,
  }, message);
}

export function discardCard(state: GameState, cardInstanceId: string): GameState {
  if (state.status !== 'playing') return state;
  if (state.discardedThisTurn >= MAX_DISCARDS_PER_TURN) {
    return prependLog(state, 'Deux defausses maximum. Le systeme a dit non.', 'Still Pro.Hibited.');
  }

  const players = clonePlayers(state.players);
  const activePlayer = players[state.currentPlayerIndex];
  const removed = withoutCard(activePlayer.hand, cardInstanceId);
  if (!removed.card) return state;

  activePlayer.hand = removed.hand;
  return prependLog({
    ...state,
    players,
    discardPile: [removed.card, ...state.discardPile],
    discardedThisTurn: state.discardedThisTurn + 1,
  }, `${activePlayer.name} defausse ${removed.card.name}. Choix discutable, donc parfait.`);
}

export function trySmoke(state: GameState, playerId: string, smokeCardInstanceId?: string, targetPlayerId?: string, targetSetIndex = 0): GameState {
  if (state.status !== 'playing') return state;

  const playerIndex = state.players.findIndex(player => player.id === playerId);
  if (playerIndex < 0) return state;
  const player = state.players[playerIndex];
  const targetPlayer = targetPlayerId ? state.players.find(item => item.id === targetPlayerId) : player;
  if (!targetPlayer) return state;
  const targetPlayerIndex = state.players.findIndex(item => item.id === targetPlayer.id);
  const setIndex = normalizeSetIndex(targetPlayer, targetSetIndex);
  const selectedSet = targetPlayer.sets[setIndex];
  const smokeCard = smokeCardInstanceId
    ? player.hand.find(card => card.instanceId === smokeCardInstanceId && card.cardId === 'smoke_me')
    : player.hand.find(card => card.cardId === 'smoke_me');

  if (!smokeCard || !isSetComplete(selectedSet) || (targetPlayer.id !== player.id && !player.isJunky)) {
    return prependLog(state, 'Still Pro.Hibited.', 'Still Pro.Hibited.');
  }

  const points = scoreSet(selectedSet, state.config.mode);
  const players = clonePlayers(state.players);
  const scoringPlayer = players[playerIndex];
  const receiver = players[targetPlayerIndex];
  const removed = withoutCard(scoringPlayer.hand, smokeCard.instanceId);
  const validatedSet = receiver.sets[setIndex];
  scoringPlayer.hand = removed.hand;
  receiver.sets[setIndex] = [];
  scoringPlayer.isJunky = true;
  scoringPlayer.score += points;

  const hasWinner = scoringPlayer.score >= state.config.targetScore;
  const product = getSetProduct(validatedSet)?.toUpperCase() ?? 'MYSTERE';
  const ownerLabel = receiver.id === scoringPlayer.id ? '' : ` chez ${receiver.name}`;
  const validationMessage = `Exception granted. You became Junky. ${scoringPlayer.name} valide ${product}${ownerLabel} sur le slot ${setIndex + 1} pour ${points} point${points > 1 ? 's' : ''}.`;

  return {
    ...state,
    players,
    discardPile: [smokeCard, ...validatedSet.map(toDiscardCard), ...state.discardPile],
    status: hasWinner ? 'finished' : 'playing',
    winnerId: hasWinner ? scoringPlayer.id : undefined,
    tableMessage: hasWinner ? `${scoringPlayer.name} gagne la partie.` : 'Exception granted. You became Junky.',
    eventLog: [hasWinner ? `${validationMessage} Partie terminee.` : validationMessage, ...state.eventLog].slice(0, 12),
  };
}

export function nextTurn(state: GameState): GameState {
  if (state.status !== 'playing') return state;

  const players = clonePlayers(state.players);
  const activePlayer = players[state.currentPlayerIndex];
  const refill = refillHand(activePlayer, state.deck, state.discardPile);
  players[state.currentPlayerIndex] = refill.player;

  const nextPlayerIndex = (state.currentPlayerIndex + 1) % players.length;
  return prependLog({
    ...state,
    players,
    deck: refill.deck,
    discardPile: refill.discardPile,
    currentPlayerIndex: nextPlayerIndex,
    turnNumber: state.turnNumber + 1,
    playedThisTurn: 0,
    discardedThisTurn: 0,
  }, `${activePlayer.name} reprend ${refill.drawn} carte${refill.drawn > 1 ? 's' : ''}. ${players[nextPlayerIndex].name}, a toi de nier l'evidence.`);
}

export function dispatchGameAction(state: GameState, action: GameAction): GameState {
  if (action.type === 'play_card') return playCard(state, action.cardInstanceId, action.targetPlayerId, action.targetSetIndex);
  if (action.type === 'discard_card') return discardCard(state, action.cardInstanceId);
  if (action.type === 'try_smoke') return trySmoke(state, action.playerId, undefined, action.targetPlayerId, action.targetSetIndex);
  if (action.type === 'end_turn') return nextTurn(state);
  return state;
}

export { canPlayCard };
