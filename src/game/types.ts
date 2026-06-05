export type CardFamily = 'product' | 'build' | 'container' | 'fire' | 'smoke' | 'attack' | 'special';

export type CardId =
  | 'weed' | 'hash' | 'cbd'
  | 'filter' | 'paper' | 'fire' | 'bbq'
  | 'bong' | 'blunt' | 'smoke_me'
  | 'wind' | 'rain' | 'cops' | 'lost';

export type CardDefinition = {
  cardId: CardId;
  name: string;
  family: CardFamily;
  effect: string;
  countMvp: number;
  rarity?: string;
  edition?: string;
  cosmeticOnly?: boolean;
};

export type CardInstance = CardDefinition & {
  instanceId: string;
};

export type SetCard = {
  instanceId: string;
  cardId: CardId;
  attackMarks: number;
  playedOrder: number;
};

export type Player = {
  id: string;
  name: string;
  hand: CardInstance[];
  set: SetCard[];
  isJunky: boolean;
  score: number;
};

export type GameState = {
  players: Player[];
  deck: CardInstance[];
  discardPile: CardInstance[];
  currentPlayerIndex: number;
  turnNumber: number;
  playedThisTurn: number;
  status: 'lobby' | 'playing' | 'finished';
  winnerId?: string;
  eventLog: string[];
};
