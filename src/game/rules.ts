import type { CardId, CardInstance, GameState, Player, ProductCardId, SetCard } from './types';

const PRODUCTS: ProductCardId[] = ['weed', 'hash', 'cbd'];
const RESISTANT: CardId[] = ['bong', 'blunt', 'bbq'];
const FIRE_CARDS: CardId[] = ['fire', 'bbq'];
const CONTAINER_CARDS: CardId[] = ['bong', 'blunt'];

export function hasAny(set: SetCard[], ids: CardId[]): boolean {
  return set.some(item => ids.includes(item.cardId));
}

export function hasCard(set: SetCard[], id: CardId): boolean {
  return set.some(item => item.cardId === id);
}

export function getSetProduct(set: SetCard[]): ProductCardId | undefined {
  return set.find(item => PRODUCTS.includes(item.cardId as ProductCardId))?.cardId as ProductCardId | undefined;
}

export function isClassicSetComplete(set: SetCard[]): boolean {
  return hasAny(set, PRODUCTS) && hasCard(set, 'filter') && hasCard(set, 'paper') && hasAny(set, FIRE_CARDS);
}

export function isContainerSetComplete(set: SetCard[]): boolean {
  return hasAny(set, PRODUCTS) && hasAny(set, CONTAINER_CARDS) && hasAny(set, FIRE_CARDS);
}

export function isSetComplete(set: SetCard[]): boolean {
  return isClassicSetComplete(set) || isContainerSetComplete(set);
}

export function isResistant(cardId: CardId): boolean {
  return RESISTANT.includes(cardId);
}

export function canCopsDestroy(set: SetCard[]): boolean {
  return hasAny(set, ['weed', 'hash']);
}

export function canPlayerSmoke(player: Player): boolean {
  return isSetComplete(player.set) && player.hand.some(card => card.cardId === 'smoke_me');
}

export function scoreSet(set: SetCard[], mode: GameState['config']['mode']): number {
  if (mode === 'quick') return 1;

  const product = getSetProduct(set);
  if (product === 'weed') return 15;
  if (product === 'hash') return 10;
  if (product === 'cbd') return 5;
  return 0;
}

export function canAddToOwnSet(card: CardInstance, player: Player): boolean {
  const set = player.set;
  if (isSetComplete(set)) return false;

  if (card.family === 'product') return !hasAny(set, PRODUCTS);
  if (card.cardId === 'filter') return !hasAny(set, CONTAINER_CARDS) && !hasCard(set, 'filter');
  if (card.cardId === 'paper') return !hasAny(set, CONTAINER_CARDS) && !hasCard(set, 'paper');
  if (card.cardId === 'bong' || card.cardId === 'blunt') {
    return !hasAny(set, CONTAINER_CARDS) && !hasCard(set, 'filter') && !hasCard(set, 'paper');
  }
  if (card.cardId === 'fire' || card.cardId === 'bbq') return !hasAny(set, FIRE_CARDS);

  return false;
}

export function canPlayCard(state: GameState, card: CardInstance, targetPlayerId?: string): boolean {
  if (state.status !== 'playing') return false;

  const player = state.players[state.currentPlayerIndex];
  const cardIsInHand = player.hand.some(handCard => handCard.instanceId === card.instanceId);
  if (!cardIsInHand) return false;

  if (card.cardId === 'smoke_me') return isSetComplete(player.set);

  if (card.family === 'attack') {
    const target = state.players.find(item => item.id === targetPlayerId);
    return Boolean(target && target.id !== player.id && target.set.length > 0);
  }

  return canAddToOwnSet(card, player);
}
