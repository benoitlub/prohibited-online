export type CardFamily = 'product' | 'build' | 'container' | 'fire' | 'smoke' | 'attack' | 'special';

export type CardId =
  | 'weed' | 'hash' | 'cbd'
  | 'filter' | 'paper' | 'fire' | 'bbq'
  | 'bong' | 'blunt' | 'smoke_me'
  | 'wind' | 'rain' | 'cops' | 'lost';

export type ProductCardId = 'weed' | 'hash' | 'cbd';
export type GameMode = 'quick' | 'long';
export type LongTargetScore = 30 | 50 | 100;

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
  name: string;
  family: CardFamily;
  attackMarks: number;
  playedOrder: number;
};

export type SetSlot = SetCard[];

export type Player = {
  id: string;
  name: string;
  hand: CardInstance[];
  sets: SetSlot[];
  isJunky: boolean;
  score: number;
};

export type GameConfig = {
  playerCount: number;
  mode: GameMode;
  targetScore: number;
};

export type GameStatus = 'lobby' | 'playing' | 'finished';

export type GameState = {
  config: GameConfig;
  players: Player[];
  deck: CardInstance[];
  discardPile: CardInstance[];
  currentPlayerIndex: number;
  turnNumber: number;
  playedThisTurn: number;
  discardedThisTurn: number;
  nextPlayedOrder: number;
  status: GameStatus;
  winnerId?: string;
  eventLog: string[];
  tableMessage: string;
};

export type GameAction =
  | { type: 'play_card'; cardInstanceId: string; targetPlayerId?: string; targetSetIndex?: number }
  | { type: 'discard_card'; cardInstanceId: string }
  | { type: 'try_smoke'; playerId: string; targetSetIndex?: number }
  | { type: 'end_turn' };
