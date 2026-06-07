import type { CardDefinition } from './types';

export const CARD_DEFINITIONS: CardDefinition[] = [
  { cardId: 'weed', name: 'Weed', family: 'product', effect: 'Produit. Vulnérable à Cops.', countMvp: 3, edition: '2025' },
  { cardId: 'hash', name: 'Hash', family: 'product', effect: 'Produit. Vulnérable à Cops.', countMvp: 3, edition: '2025' },
  { cardId: 'cbd', name: 'CBD', family: 'product', effect: 'Produit. Protégé contre Cops.', countMvp: 3, edition: '2025' },
  { cardId: 'filter', name: 'Filter', family: 'build', effect: 'Nécessaire au combo classique.', countMvp: 4, edition: '2025' },
  { cardId: 'paper', name: 'Paper', family: 'build', effect: 'Nécessaire au combo classique.', countMvp: 4, edition: '2025' },
  { cardId: 'fire', name: 'Fire', family: 'fire', effect: 'Allumage standard.', countMvp: 4, edition: '2025' },
  { cardId: 'bbq', name: 'BBQ', family: 'fire', effect: 'Remplace Fire. Résiste à deux attaques Wind/Rain.', countMvp: 3, edition: '2025' },
  { cardId: 'bong', name: 'Bong', family: 'container', effect: 'Remplace Filter + Paper. Résiste à deux attaques Wind/Rain.', countMvp: 3, edition: '2025' },
  { cardId: 'blunt', name: 'Blunt', family: 'container', effect: 'Remplace Filter + Paper. Résiste à deux attaques Wind/Rain.', countMvp: 3, edition: '2025' },
  { cardId: 'smoke_me', name: 'Smoke Me', family: 'smoke', effect: 'Valide un set complet.', countMvp: 4, edition: '2025' },
  { cardId: 'wind', name: 'Wind', family: 'attack', effect: 'Retire la dernière carte posée. Marque Bong/Blunt/BBQ.', countMvp: 4, edition: '2025' },
  { cardId: 'rain', name: 'Rain', family: 'attack', effect: 'Retire la dernière carte posée. Marque Bong/Blunt/BBQ.', countMvp: 4, edition: '2025' },
  { cardId: 'cops', name: 'Cops', family: 'attack', effect: 'Détruit un set Weed/Hash. Aucun effet sur CBD.', countMvp: 4, edition: '2025' },
  { cardId: 'lost', name: 'Lost', family: 'attack', effect: 'Détruit entièrement le set ciblé.', countMvp: 4, edition: '2025' },
];
