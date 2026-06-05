import { CARD_DEFINITIONS } from './cards';
import type { CardInstance, Player } from './types';

function makeInstanceId(cardId: string, index: number): string {
  const randomId = globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2);
  return `${cardId}-${index}-${randomId}`;
}

export function createDeck(): CardInstance[] {
  const deck: CardInstance[] = [];
  for (const card of CARD_DEFINITIONS) {
    for (let i = 0; i < card.countMvp; i += 1) {
      deck.push({ ...card, instanceId: makeInstanceId(card.cardId, i) });
    }
  }
  return deck;
}

export function shuffleDeck(deck: CardInstance[]): CardInstance[] {
  const copy = [...deck];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function dealCards(players: Player[], deck: CardInstance[], handSize = 5): { players: Player[]; deck: CardInstance[] } {
  const nextPlayers = players.map(player => ({ ...player, hand: [...player.hand] }));
  const nextDeck = [...deck];

  for (let cardIndex = 0; cardIndex < handSize; cardIndex += 1) {
    for (const player of nextPlayers) {
      const card = nextDeck.shift();
      if (card) player.hand.push(card);
    }
  }

  return { players: nextPlayers, deck: nextDeck };
}
