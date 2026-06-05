import type { CardId, Player, SetCard } from './types';

const PRODUCTS: CardId[] = ['weed', 'hash', 'cbd'];
const RESISTANT: CardId[] = ['bong', 'blunt', 'bbq'];

export function hasAny(set: SetCard[], ids: CardId[]): boolean {
  return set.some(item => ids.includes(item.cardId));
}

export function hasCard(set: SetCard[], id: CardId): boolean {
  return set.some(item => item.cardId === id);
}

export function isClassicSetComplete(set: SetCard[]): boolean {
  return hasAny(set, PRODUCTS) && hasCard(set, 'filter') && hasCard(set, 'paper') && hasAny(set, ['fire', 'bbq']);
}

export function isContainerSetComplete(set: SetCard[]): boolean {
  return hasAny(set, PRODUCTS) && hasAny(set, ['bong', 'blunt']) && hasAny(set, ['fire', 'bbq']);
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
