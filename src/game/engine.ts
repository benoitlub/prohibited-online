import { createDeck, dealCards, shuffleDeck } from './deck';
import { canCopsDestroy, canPlayCard, getSetProduct, isResistant, isSetComplete, scoreSet } from './rules';
import type { CardInstance, GameAction, GameConfig, GameState, Player, SetCard } from './types';

const HAND_SIZE = 5;
const MAX_DISCARDS_PER_TURN = 2;

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

function createPlayers(playerCount: number): Player[] {
  return Array.from({ length: playerCount }, (_, index) => ({
    id: `player-${index + 1}`,
    name: `Joueur ${index + 1}`,
    hand: [],
    set: [],
    isJunky: false,
    score: 0,
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

function withoutCard(hand: CardInstance[], cardInstanceId: string): { hand: CardInstance[]; card?: CardInstance } {
  const card = hand.find(item => item.instanceId === cardInstanceId);
  return { card, hand: hand.filter(item => item.instanceId !== cardInstanceId) };
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
  const nextPlayer = { ...player, hand: [...player.hand] };
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
    eventLog: ['La table est ouverte. Premier refus dans 3... 2... 1...'],
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

export function playCard(state: GameState, cardInstanceId: string, targetPlayerId?: string): GameState {
  if (state.status !== 'playing') return state;

  const activePlayer = state.players[state.currentPlayerIndex];
  const { card } = withoutCard(activePlayer.hand, cardInstanceId);
  if (!card || !canPlayCard(state, card, targetPlayerId)) {
    return prependLog(state, 'Still Pro.Hibited.', 'Still Pro.Hibited.');
  }

  if (card.cardId === 'smoke_me') return trySmoke(state, activePlayer.id, card.instanceId);

  const players = state.players.map(player => ({ ...player, hand: [...player.hand], set: [...player.set] }));
  const current = players[state.currentPlayerIndex];
  const removed = withoutCard(current.hand, cardInstanceId);
  current.hand = removed.hand;

  let message = `${current.name} pose ${card.name}. Le set prend forme.`;

  if (card.family === 'attack') {
    const target = players.find(player => player.id === targetPlayerId);
    if (!target) return state;

    if (card.cardId === 'wind' || card.cardId === 'rain') {
      const before = target.set.length;
      target.set = applyWindOrRain(target.set);
      message = before === target.set.length
        ? `${current.name} envoie ${card.name}. ${target.name} encaisse, mais ca tremble.`
        : `${current.name} envoie ${card.name}. Derniere carte de ${target.name} ejectee.`;
    }

    if (card.cardId === 'lost') {
      target.set = applyLost();
      message = `${current.name} joue Lost. Le set de ${target.name} disparait du plan.`;
    }

    if (card.cardId === 'cops') {
      const product = getSetProduct(target.set);
      target.set = applyCops(target.set);
      message = product === 'cbd'
        ? `${current.name} appelle Cops. CBD presente ses papiers, aucun effet.`
        : `${current.name} appelle Cops. Le set de ${target.name} part au poste.`;
    }
  } else {
    current.set = [...current.set, toSetCard(card, state.nextPlayedOrder)];
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

  const players = state.players.map(player => ({ ...player, hand: [...player.hand], set: [...player.set] }));
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

export function trySmoke(state: GameState, playerId: string, smokeCardInstanceId?: string): GameState {
  if (state.status !== 'playing') return state;

  const playerIndex = state.players.findIndex(player => player.id === playerId);
  if (playerIndex < 0) return state;
  const player = state.players[playerIndex];
  const smokeCard = smokeCardInstanceId
    ? player.hand.find(card => card.instanceId === smokeCardInstanceId && card.cardId === 'smoke_me')
    : player.hand.find(card => card.cardId === 'smoke_me');

  if (!smokeCard || !isSetComplete(player.set)) {
    return prependLog(state, 'Still Pro.Hibited.', 'Still Pro.Hibited.');
  }

  const points = scoreSet(player.set, state.config.mode);
  const players = state.players.map(item => ({ ...item, hand: [...item.hand], set: [...item.set] }));
  const scoringPlayer = players[playerIndex];
  const removed = withoutCard(scoringPlayer.hand, smokeCard.instanceId);
  const validatedSet = scoringPlayer.set;
  scoringPlayer.hand = removed.hand;
  scoringPlayer.set = [];
  scoringPlayer.isJunky = true;
  scoringPlayer.score += points;

  const hasWinner = scoringPlayer.score >= state.config.targetScore;
  const product = getSetProduct(validatedSet)?.toUpperCase() ?? 'MYSTERE';
  const validationMessage = `Exception granted. You became Junky. ${scoringPlayer.name} valide ${product} pour ${points} point${points > 1 ? 's' : ''}.`;

  return {
    ...state,
    players,
    discardPile: [smokeCard, ...validatedSet.map(card => ({
      instanceId: card.instanceId,
      cardId: card.cardId,
      name: card.name,
      family: card.family,
      effect: 'Carte validee dans un set.',
      countMvp: 1,
    })), ...state.discardPile],
    status: hasWinner ? 'finished' : 'playing',
    winnerId: hasWinner ? scoringPlayer.id : undefined,
    tableMessage: hasWinner ? `${scoringPlayer.name} gagne la partie.` : 'Exception granted. You became Junky.',
    eventLog: [hasWinner ? `${validationMessage} Partie terminee.` : validationMessage, ...state.eventLog].slice(0, 12),
  };
}

export function nextTurn(state: GameState): GameState {
  if (state.status !== 'playing') return state;

  const players = state.players.map(player => ({ ...player, hand: [...player.hand], set: [...player.set] }));
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
  if (action.type === 'play_card') return playCard(state, action.cardInstanceId, action.targetPlayerId);
  if (action.type === 'discard_card') return discardCard(state, action.cardInstanceId);
  if (action.type === 'try_smoke') return trySmoke(state, action.playerId);
  if (action.type === 'end_turn') return nextTurn(state);
  return state;
}

export { canPlayCard };
