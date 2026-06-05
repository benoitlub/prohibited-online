import { CARD_DEFINITIONS } from './cards';
import type { CardInstance } from './types';

export function createDeck(): CardInstance[] {
  const deck: CardInstance[] = [];
  for (const card of CARD_DEFINITIONS) {
    for (let i = 0; i < card.countMvp; i++) {
      deck.push({ ...card, instanceId: `${card.cardId}-${i}-${crypto.randomUUID()}` });
    }
  }
  return deck;
}

export function shuffleDeck(deck: CardInstance[]): CardInstance[] {
  const copy = [...deck];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
