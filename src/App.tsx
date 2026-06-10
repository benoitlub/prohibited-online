import { useState } from 'react';
import type { CSSProperties } from 'react';
import { canPlayCard, createGame, dispatchGameAction } from './game/engine';
import type { CardFamily, CardId, CardInstance, GameMode, GameState, LongTargetScore, Player, SetCard } from './game/types';

const cardImageModules = import.meta.glob<string>('./assets/cards2025/*.png', { eager: true, import: 'default' });
const CARD_IMAGES_BY_ID = Object.entries(cardImageModules).reduce<Record<string, string[]>>((images, [path, url]) => {
  const match = path.match(/\/([a-z_]+)-\d+\.png$/);
  if (!match) return images;
  images[match[1]] = [...(images[match[1]] ?? []), url];
  return images;
}, {});

const longTargets: LongTargetScore[] = [30, 50, 100];
const familyLabels: Record<CardFamily, string> = {
  product: 'Produit',
  build: 'Build',
  container: 'Objet',
  fire: 'Feu',
  smoke: 'Smoke',
  attack: 'Attaque',
  special: 'Special',
};

type SlotTarget = { playerId: string; setIndex: number };
type SeatedPlayer = { player: Player; playerIndex: number; seatClass: string };

function getCardImage(cardId: CardId, instanceId: string): string | undefined {
  const images = CARD_IMAGES_BY_ID[cardId];
  if (!images?.length) return undefined;
  const hash = [...instanceId].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return images[hash % images.length];
}

function setLabel(set: SetCard[], index: number): string {
  return set.length === 0 ? `Slot ${index + 1}` : `Slot ${index + 1} / ${set.length}`;
}

function getPreferredOwnSetIndex(player: Player, currentIndex: number, card?: CardInstance): number {
  if (!card || card.family !== 'product') return currentIndex;
  if (player.sets[currentIndex]?.length === 0) return currentIndex;
  const freeIndex = player.sets.findIndex(set => set.length === 0);
  return freeIndex >= 0 ? freeIndex : currentIndex;
}

function getPlayableTargets(state: GameState, card: CardInstance): SlotTarget[] {
  return state.players.flatMap(player => player.sets
    .map((_, setIndex) => ({ playerId: player.id, setIndex }))
    .filter(target => canPlayCard(state, card, target.playerId, target.setIndex)));
}

function shouldUseTargetMode(activePlayer: Player, card: CardInstance): boolean {
  if (card.family === 'attack') return true;
  return activePlayer.isJunky && card.family !== 'special';
}

function getOpponentSeatClass(opponentIndex: number, playerCount: number): string {
  const seatsByCount: Record<number, string[]> = {
    2: ['seat-top'],
    3: ['seat-top-left', 'seat-top-right'],
    4: ['seat-left', 'seat-top', 'seat-right'],
    5: ['seat-left', 'seat-top-left', 'seat-top-right', 'seat-right'],
  };

  return seatsByCount[playerCount]?.[opponentIndex] ?? 'seat-top';
}

function getSeatedPlayers(players: Player[], activePlayerIndex: number): SeatedPlayer[] {
  const activeSeat: SeatedPlayer = {
    player: players[activePlayerIndex],
    playerIndex: activePlayerIndex,
    seatClass: 'seat-bottom',
  };
  const opponents = players
    .map((player, playerIndex) => ({ player, playerIndex }))
    .filter(({ playerIndex }) => playerIndex !== activePlayerIndex)
    .map((entry, opponentIndex) => ({
      ...entry,
      seatClass: getOpponentSeatClass(opponentIndex, players.length),
    }));

  return [activeSeat, ...opponents];
}

function CardButton({ card, disabled, pending, targetMode, canMoveLeft, canMoveRight, onPlay, onDiscard, onMoveLeft, onMoveRight }: {
  card: CardInstance;
  disabled: boolean;
  pending?: boolean;
  targetMode?: boolean;
  canMoveLeft?: boolean;
  canMoveRight?: boolean;
  onPlay: () => void;
  onDiscard: () => void;
  onMoveLeft?: () => void;
  onMoveRight?: () => void;
}) {
  const playLabel = targetMode ? 'Cibler' : 'Jouer';
  const playIcon = targetMode ? '◎' : '▶';
  const image = getCardImage(card.cardId, card.instanceId);
  return (
    <article className={`card card-${card.family} ${pending ? 'pending-card' : ''}`}>
      {image && <img className="card-face" src={image} alt={card.name} draggable={false} />}
      <div className="card-topline">
        <span>{familyLabels[card.family]}</span>
        <strong>{card.name}</strong>
      </div>
      <p>{card.effect}</p>
      <div className="card-actions">
        <button type="button" className="icon-action play-action" onClick={onPlay} disabled={disabled} aria-label={`${playLabel} ${card.name}`} title={playLabel}>
          <span aria-hidden="true">{playIcon}</span>
        </button>
        <button type="button" className="icon-action discard-action ghost" onClick={onDiscard} aria-label={`Defausser ${card.name}`} title="Defausser">
          <span aria-hidden="true">×</span>
        </button>
      </div>
      <div className="card-reorder" aria-label="Reorganiser la main">
        <button type="button" onClick={onMoveLeft} disabled={!canMoveLeft} aria-label={`Deplacer ${card.name} vers la gauche`}>←</button>
        <button type="button" onClick={onMoveRight} disabled={!canMoveRight} aria-label={`Deplacer ${card.name} vers la droite`}>→</button>
      </div>
    </article>
  );
}

function SetSlotView({ set, index, selected, selectable, attackable, autoSelected, onSelect }: {
  set: SetCard[];
  index: number;
  selected?: boolean;
  selectable?: boolean;
  attackable?: boolean;
  autoSelected?: boolean;
  onSelect?: () => void;
}) {
  const content = (
    <>
      <span className="slot-title">{setLabel(set, index)}</span>
      <div className="set-column">
        {set.length === 0 ? <span className="empty-set">Vide</span> : [...set]
          .sort((a, b) => a.playedOrder - b.playedOrder)
          .map((card, cardIndex) => (
            <span key={card.instanceId} className={`set-card set-${card.family}`} style={{ '--stack-index': cardIndex } as CSSProperties}>
              {getCardImage(card.cardId, card.instanceId) ? (
                <img src={getCardImage(card.cardId, card.instanceId)} alt={card.name} draggable={false} />
              ) : (
                <span>{card.name}</span>
              )}
              {card.attackMarks > 0 && <em>x{card.attackMarks}</em>}
            </span>
          ))}
      </div>
    </>
  );

  const slotClass = `set-slot ${selected ? 'selected' : ''} ${attackable ? 'attackable' : ''} ${autoSelected ? 'auto-selected-slot' : ''}`;

  if (!selectable) {
    return <div className={slotClass}>{content}</div>;
  }

  return (
    <button type="button" className={`selectable ${slotClass}`} onClick={onSelect}>
      {content}
    </button>
  );
}

function PlayerPanel({ player, active, selectedOwnSetIndex, autoSelectedSetIndex, onSelectOwnSet, targetingCard, validTargets, onTargetSlot }: {
  player: Player;
  active: boolean;
  selectedOwnSetIndex: number;
  autoSelectedSetIndex?: number | null;
  onSelectOwnSet: (setIndex: number) => void;
  targetingCard: CardInstance | null;
  validTargets: SlotTarget[];
  onTargetSlot: (playerId: string, setIndex: number) => void;
}) {
  const isTargeting = Boolean(targetingCard);
  return (
    <section className={`player-panel ${active ? 'active' : ''} ${isTargeting ? 'targeting' : ''}`}>
      <div className="player-heading">
        <h3>{player.name}{player.isJunky ? ' - Junky' : ''}</h3>
        <span>{player.score} pts</span>
      </div>
      <div className="sets-grid">
        {player.sets.map((set, index) => {
          const canTarget = validTargets.some(target => target.playerId === player.id && target.setIndex === index);
          return (
            <SetSlotView
              key={`${player.id}-${index}`}
              set={set}
              index={index}
              selectable={(active && !isTargeting) || canTarget}
              selected={active && !isTargeting && selectedOwnSetIndex === index}
              autoSelected={active && !isTargeting && autoSelectedSetIndex === index}
              attackable={canTarget}
              onSelect={() => canTarget ? onTargetSlot(player.id, index) : onSelectOwnSet(index)}
            />
          );
        })}
      </div>
    </section>
  );
}

function ConfigScreen({ onStart }: { onStart: (playerCount: number, mode: GameMode, targetScore: number) => void }) {
  const [playerCount, setPlayerCount] = useState(2);
  const [mode, setMode] = useState<GameMode>('quick');
  const [targetScore, setTargetScore] = useState<LongTargetScore>(30);

  return (
    <main className="config-screen">
      <header className="feuch-header">
        <strong>FEUCH INSTITUT</strong>
        <span>Pro.Hibited Online</span>
        <em>TABLE BUILD v0.8.3</em>
      </header>

      <section className="config-hero">
        <p className="kicker">Prototype local - table console</p>
        <h1>Pro.Hibited Online</h1>
        <p>Installe les joueurs, choisis le rythme, puis ouvre la table. Le paquet fait semblant d'être innocent.</p>
      </section>

      <section className="config-panel" aria-label="Console de configuration">
        <div className="config-group">
          <p className="config-label">Nombre de joueurs</p>
          <div className="option-grid players-grid">
            {[
              { value: 2, icon: '🎭', label: 'Duel', detail: 'Face à face' },
              { value: 3, icon: '🍄', label: 'Trio', detail: 'Petit chaos' },
              { value: 4, icon: '🌴', label: 'Table 4', detail: 'Salon complet' },
              { value: 5, icon: '🎪', label: 'Table 5', detail: 'Cirque officiel' },
            ].map(option => (
              <button
                key={option.value}
                type="button"
                className={`table-option ${playerCount === option.value ? 'selected' : ''}`}
                onClick={() => setPlayerCount(option.value)}
              >
                <span>{option.icon}</span>
                <strong>{option.label}</strong>
                <small>{option.detail}</small>
              </button>
            ))}
          </div>
        </div>

        <div className="config-group">
          <p className="config-label">Mode de partie</p>
          <div className="option-grid mode-grid">
            {[
              { value: 'quick' as GameMode, icon: '⚡', label: 'Rapide', detail: '3 points, carnage express' },
              { value: 'long' as GameMode, icon: '🏆', label: 'Longue', detail: 'Objectif réglable' },
            ].map(option => (
              <button
                key={option.value}
                type="button"
                className={`table-option ${mode === option.value ? 'selected' : ''}`}
                onClick={() => setMode(option.value)}
              >
                <span>{option.icon}</span>
                <strong>{option.label}</strong>
                <small>{option.detail}</small>
              </button>
            ))}
          </div>
        </div>

        {mode === 'long' && (
          <div className="config-group score-group">
            <p className="config-label">Objectif</p>
            <div className="score-tokens">
              {longTargets.map(value => (
                <button
                  key={value}
                  type="button"
                  className={`score-token ${targetScore === value ? 'selected' : ''}`}
                  onClick={() => setTargetScore(value)}
                >
                  {value} pts
                </button>
              ))}
            </div>
          </div>
        )}

        <button type="button" className="start-button" onClick={() => onStart(playerCount, mode, mode === 'quick' ? 3 : targetScore)}>
          Ouvrir la table
        </button>
      </section>

      <footer className="feuch-footer">
        <strong>Feuch Institut</strong>
        <span>Experimental Table Layout</span>
        <span>Undo Last Action Enabled</span>
        <span>Main Branch</span>
      </footer>
    </main>
  );
}

export default function App() {
  const [game, setGame] = useState<GameState | null>(null);
  const [history, setHistory] = useState<GameState[]>([]);
  const [selectedOwnSetIndex, setSelectedOwnSetIndex] = useState(0);
  const [autoSelectedSetIndex, setAutoSelectedSetIndex] = useState<number | null>(null);
  const [targetingCard, setTargetingCard] = useState<CardInstance | null>(null);

  const activePlayer = game?.players[game.currentPlayerIndex];
  const validTargets = game && targetingCard ? getPlayableTargets(game, targetingCard) : [];

  if (!game || !activePlayer) {
    return <ConfigScreen onStart={(playerCount, mode, targetScore) => {
      const nextGame = createGame({ playerCount, mode, targetScore });
      setHistory([]);
      setSelectedOwnSetIndex(0);
      setAutoSelectedSetIndex(null);
      setTargetingCard(null);
      setGame(nextGame);
    }} />;
  }

  const commitGameAction = (next: GameState) => {
    setHistory(previous => [game, ...previous].slice(0, 12));
    setSelectedOwnSetIndex(current => Math.min(current, next.players[next.currentPlayerIndex].sets.length - 1));
    setAutoSelectedSetIndex(null);
    setTargetingCard(null);
    setGame(next);
  };

  const undoLastAction = () => {
    const previousGame = history[0];
    if (!previousGame) return;
    setGame(previousGame);
    setSelectedOwnSetIndex(current => Math.min(current, previousGame.players[previousGame.currentPlayerIndex].sets.length - 1));
    setAutoSelectedSetIndex(null);
    setTargetingCard(null);
    setHistory(history.slice(1));
  };

  const restartGame = () => {
    setGame(createGame(game.config));
    setHistory([]);
    setSelectedOwnSetIndex(0);
    setAutoSelectedSetIndex(null);
    setTargetingCard(null);
  };

  const selectOwnSet = (setIndex: number) => {
    setSelectedOwnSetIndex(setIndex);
    setAutoSelectedSetIndex(null);
  };

  const moveHandCard = (cardIndex: number, direction: -1 | 1) => {
    const targetIndex = cardIndex + direction;
    if (targetIndex < 0 || targetIndex >= activePlayer.hand.length) return;
    setGame(current => {
      if (!current) return current;
      return {
        ...current,
        players: current.players.map((player, playerIndex) => {
          if (playerIndex !== current.currentPlayerIndex) return player;
          const nextHand = [...player.hand];
          [nextHand[cardIndex], nextHand[targetIndex]] = [nextHand[targetIndex], nextHand[cardIndex]];
          return { ...player, hand: nextHand };
        }),
      };
    });
  };

  const targetSlot = (targetPlayerId: string, targetSetIndex: number) => {
    if (!targetingCard) return;
    if (targetingCard.cardId === 'smoke_me') {
      commitGameAction(dispatchGameAction(game, {
        type: 'try_smoke',
        playerId: activePlayer.id,
        targetPlayerId,
        targetSetIndex,
      }));
      return;
    }

    commitGameAction(dispatchGameAction(game, {
      type: 'play_card',
      cardInstanceId: targetingCard.instanceId,
      targetPlayerId,
      targetSetIndex,
    }));
  };

  const winner = game.winnerId ? game.players.find(player => player.id === game.winnerId) : undefined;
  const seatedPlayers = getSeatedPlayers(game.players, game.currentPlayerIndex);
  const liveMessage = targetingCard
    ? `Choisis un slot pour ${targetingCard.name}. ${activePlayer.isJunky ? 'Le Junky peut jouer chez les autres.' : 'Rien ne part sans cible.'}`
    : game.status === 'finished' && winner ? `${winner.name} gagne. Relance obligatoire.` : game.tableMessage;

  return (
    <main className={`game-screen ${winner ? 'has-winner' : ''}`}>
      <header className="topbar">
        <div>
          <p className="kicker">HERE, WE DON'T SMOKE. IT'S PRO.HIBITED.</p>
          <h1>Pro.Hibited Online</h1>
        </div>
        <div className="score-strip">
          <span>Tour {game.turnNumber}</span>
          <span>{game.config.mode === 'quick' ? 'Rapide' : 'Longue'} / {game.config.targetScore} pts</span>
          <button type="button" onClick={() => {
            setHistory([]);
            setGame(null);
          }}>Nouvelle partie</button>
        </div>
      </header>

      {winner && (
        <section className="victory-banner" role="status" aria-live="polite">
          <div className="victory-badge">🏆</div>
          <div>
            <p>Victoire interdite</p>
            <h2>{winner.name} devient Junky supreme</h2>
            <span>{winner.score} pts — la table demande une revanche.</span>
          </div>
          <button type="button" onClick={restartGame}>Revanche</button>
        </section>
      )}

      <section className={`table-message ${game.status === 'finished' ? 'winner' : ''} ${targetingCard ? 'targeting' : ''}`}>
        {liveMessage}
      </section>

      <section className="board-grid">
        <div className="players-area table-layout">
          <div className="table-surface" aria-label="Table de jeu">
            {targetingCard && activePlayer.isJunky && (
              <svg className="junky-target-curve" viewBox="0 0 1000 1000" preserveAspectRatio="none" aria-hidden="true">
                <path d="M 500 940 C 420 720, 610 580, 720 380" />
              </svg>
            )}
            <div className="table-hud" aria-label="Infos de partie">
              <span>
                <small>Mode</small>
                {game.config.mode === 'quick' ? 'Rapide' : 'Longue'}
              </span>
              <span>
                <small>Tour</small>
                {game.turnNumber}
              </span>
              <span>
                <small>Objectif</small>
                {game.config.targetScore} pts
              </span>
            </div>
            <div className={`table-callout ${game.status === 'finished' ? 'winner' : ''} ${targetingCard ? 'targeting' : ''}`}>
              {liveMessage}
            </div>
            <div className="table-decks" aria-label="Pioches">
              <div className="table-deck draw-deck">
                <span>Draw</span>
                <div className="card-back" />
                <small>{game.deck.length}</small>
              </div>
              <div className="table-deck discard-deck">
                <span>Discard</span>
                {game.discardPile[0] ? (
                  <img src={getCardImage(game.discardPile[0].cardId, game.discardPile[0].instanceId)} alt={game.discardPile[0].name} draggable={false} />
                ) : (
                  <div className="discard-empty" />
                )}
                <small>{game.discardPile.length}</small>
              </div>
            </div>
            {seatedPlayers.map(({ player, playerIndex, seatClass }) => (
              <div key={player.id} className={`player-seat ${seatClass}`}>
                <PlayerPanel
                  player={player}
                  active={playerIndex === game.currentPlayerIndex}
                  selectedOwnSetIndex={selectedOwnSetIndex}
                  autoSelectedSetIndex={playerIndex === game.currentPlayerIndex ? autoSelectedSetIndex : null}
                  onSelectOwnSet={selectOwnSet}
                  targetingCard={targetingCard}
                  validTargets={validTargets}
                  onTargetSlot={targetSlot}
                />
              </div>
            ))}
          </div>
        </div>

        <aside className="side-panel">
          <h2>{targetingCard ? `Cibles pour ${targetingCard.name}` : 'Ciblage'}</h2>
          {targetingCard ? (
            <div className="targeting-help">
              <p>Tape un slot surligne pour jouer la carte.</p>
              <button type="button" onClick={() => setTargetingCard(null)}>Annuler ciblage</button>
              {validTargets.length === 0 && <p>Aucun slot valide. Le carton refuse poliment.</p>}
            </div>
          ) : (
            <p className="muted">Les attaques et les cartes de Junky se jouent en ciblant un slot.</p>
          )}

          <h2>Log</h2>
          <ol className="event-log">
            {game.eventLog.map((line, index) => <li key={`${line}-${index}`}>{line}</li>)}
          </ol>
        </aside>
      </section>

      <section className="hand-panel">
        <div className={`hand-status ${targetingCard ? 'targeting' : ''}`}>{liveMessage}</div>
        <div className="hand-heading">
          <div>
            <p className="kicker">Joueur actif{activePlayer.isJunky ? ' - Junky' : ''}</p>
            <h2>{activePlayer.name} / Slot {selectedOwnSetIndex + 1}</h2>
          </div>
          <div className="turn-actions">
            <span>{game.discardedThisTurn}/2 defausses</span>
            {targetingCard && <button type="button" className="cancel-button" onClick={() => setTargetingCard(null)}>Annuler ciblage</button>}
            <button type="button" className="undo-button" aria-label="Annuler la derniere action" title="Annuler la derniere action" onClick={undoLastAction} disabled={history.length === 0}>↶</button>
            <button type="button" className="end-turn-button" aria-label="Finir le tour" title="Finir le tour" onClick={() => commitGameAction(dispatchGameAction(game, { type: 'end_turn' }))}>→</button>
          </div>
        </div>

        <div className="hand-grid">
          {activePlayer.hand.map((card, index) => {
            const targetMode = shouldUseTargetMode(activePlayer, card);
            const targetCount = getPlayableTargets(game, card).length;
            const preferredSetIndex = getPreferredOwnSetIndex(activePlayer, selectedOwnSetIndex, card);
            const disabled = targetMode
              ? targetCount === 0 || Boolean(targetingCard && targetingCard.instanceId !== card.instanceId)
              : Boolean(targetingCard) || !canPlayCard(game, card, activePlayer.id, preferredSetIndex);
            return (
              <CardButton
                key={card.instanceId}
                card={card}
                targetMode={targetMode}
                pending={targetingCard?.instanceId === card.instanceId}
                disabled={disabled}
                canMoveLeft={index > 0}
                canMoveRight={index < activePlayer.hand.length - 1}
                onMoveLeft={() => moveHandCard(index, -1)}
                onMoveRight={() => moveHandCard(index, 1)}
                onPlay={() => {
                  if (targetMode) {
                    setTargetingCard(card);
                    return;
                  }
                  setSelectedOwnSetIndex(preferredSetIndex);
                  setAutoSelectedSetIndex(card.family === 'product' && preferredSetIndex !== selectedOwnSetIndex ? preferredSetIndex : null);
                  commitGameAction(dispatchGameAction(game, {
                    type: 'play_card',
                    cardInstanceId: card.instanceId,
                    targetPlayerId: activePlayer.id,
                    targetSetIndex: preferredSetIndex,
                  }));
                }}
                onDiscard={() => commitGameAction(dispatchGameAction(game, { type: 'discard_card', cardInstanceId: card.instanceId }))}
              />
            );
          })}
        </div>
      </section>
    </main>
  );
}
