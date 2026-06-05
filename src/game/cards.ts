import type { CardDefinition } from './types';

export const CARD_DEFINITIONS: CardDefinition[] = [
  { cardId: 'weed', name: 'Weed', family: 'product', effect: 'Produit. Vulnérable à Cops.', countMvp: 6 },
  { cardId: 'hash', name: 'Hash', family: 'product', effect: 'Produit. Vulnérable à Cops.', countMvp: 4 },
  { cardId: 'cbd', name: 'CBD', family: 'product', effect: 'Produit. Protégé contre Cops.', countMvp: 4 },
  { cardId: 'filter', name: 'Filter', family: 'build', effect: 'Nécessaire au combo classique.', countMvp: 8 },
  { cardId: 'paper', name: 'Paper', family: 'build', effect: 'Nécessaire au combo classique.', countMvp: 8 },
  { cardId: 'fire', name: 'Fire', family: 'fire', effect: 'Allumage standard.', countMvp: 7 },
  { cardId: 'bbq', name: 'BBQ', family: 'fire', effect: 'Remplace Fire. Résiste à deux attaques.', countMvp: 2 },
  { cardId: 'bong', name: 'Bong', family: 'container', effect: 'Remplace Filter + Paper. Résiste à deux attaques.', countMvp: 3 },
  { cardId: 'blunt', name: 'Blunt', family: 'container', effect: 'Remplace Filter + Paper. Résiste à deux attaques.', countMvp: 4 },
  { cardId: 'smoke_me', name: 'Smoke Me', family: 'smoke', effect: 'Valide un set complet.', countMvp: 5 },
  { cardId: 'wind', name: 'Wind', family: 'attack', effect: 'Retire la dernière carte posée.', countMvp: 4 },
  { cardId: 'rain', name: 'Rain', family: 'attack', effect: 'Retire la dernière carte posée.', countMvp: 4 },
  { cardId: 'cops', name: 'Cops', family: 'attack', effect: 'Détruit set Weed/Hash. Aucun effet sur CBD.', countMvp: 4 },
  { cardId: 'lost', name: 'Lost', family: 'attack', effect: 'Détruit entièrement le set ciblé.', countMvp: 3 },
];
