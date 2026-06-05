import { useState } from 'react';
import { canPlayCard, createGame, dispatchGameAction } from './game/engine';
import type { CardFamily, CardInstance, GameMode, GameState, LongTargetScore, Player, SetCard } from './game/types';

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

function setLabel(set: SetCard[], index: number): string {
  return set.length === 0 ? `Slot ${index + 1}` : `Slot ${index + 1} / ${set.length}`;
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

function CardButton({ card, disabled, pending, targetMode, onPlay, onDiscard }: {
  card: CardInstance;
  disabled: boolean;
  pending?: boolean;
  targetMode?: boolean;
  onPlay: () => void;
  onDiscard: () => void;
}) {
  const playLabel = targetMode ? 'Cibler' : 'Jouer';
  return (
    <article className={`card card-${card.family} ${pending ? 'pending-card' : ''}`}>
      <div className="card-topline">
        <span>{familyLabels[card.family]}</span>
        <strong>{card.name}</strong>
      </div>
      <p>{card.effect}</p>
      <div className="card-actions">
        <button type="button" onClick={onPlay} disabled={disabled}>{playLabel}</button>
        <button type="button" className="ghost" onClick={onDiscard}>Defausser</button>
      </div>
    </article>
  );
}

function SetSlotView({ set, index, selected, selectable, attackable, onSelect }: {
  set: SetCard[];
  index: number;
  selected?: boolean;
  selectable?: boolean;
  attackable?: boolean;
  onSelect?: () => void;
}) {
  const content = (
    <>
      <span className="slot-title">{setLabel(set, index)}</span>
      <div className="set-column">
        {set.length === 0 ? <span className="empty-set">Vide</span> : [...set]
          .sort((a, b) => a.playedOrder - b.playedOrder)
          .map((card, cardIndex) => (
            <span key={card.instanceId} className={`set-card set-${card.family}`} style={{ marginTop: cardIndex === 0 ? 0 : -2 }}>
              {card.name}{card.attackMarks > 0 ? ` x${card.attackMarks}` : ''}
            </span>
          ))}
      </div>
    </>
  );

  if (!selectable) {
    return <div className={`set-slot ${attackable ? 'attackable' : ''}`}>{content}</div>;
  }

  return (
    <button type="button" className={`set-slot selectable ${selected ? 'selected' : ''} ${attackable ? 'attackable' : ''}`} onClick={onSelect}>
      {content}
    </button>
  );
}

function PlayerPanel({ player, active, selectedOwnSetIndex, onSelectOwnSet, targetingCard, validTargets, onTargetSlot }: {
  player: Player;
  active: boolean;
  selectedOwnSetIndex: number;
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
      <section className="config-hero">
        <p className="kicker">Prototype local V0.5 - SMOKE ME CARD ONLY</p>
        <h1>Pro.Hibited Online</h1>
        <p>Version visible : plus de bouton Smoke Me global. La validation passe uniquement par la carte Smoke Me, comme dans le vrai paquet.</p>
      </section>

      <section className="config-panel">
        <label>
          Nombre de joueurs
          <select value={playerCount} onChange={event => setPlayerCount(Number(event.target.value))}>
            {[2, 3, 4, 5].map(value => <option key={value} value={value}>{value} joueurs</option>)}
          </select>
        </label>

        <div className="segmented">
          <button type="button" className={mode === 'quick' ? 'selected' : ''} onClick={() => setMode('quick')}>Rapide</button>
          <button type="button" className={mode === 'long' ? 'selected' : ''} onClick={() => setMode('long')}>Longue</button>
        </div>

        {mode === 'long' && (
          <label>
            Objectif
            <select value={targetScore} onChange={event => setTargetScore(Number(event.target.value) as LongTargetScore)}>
              {longTargets.map(value => <option key={value} value={value}>{value} points</option>)}
            </select>
          </label>
        )}

        <button type="button" className="start-button" onClick={() => onStart(playerCount, mode, mode === 'quick' ? 3 : targetScore)}>
          Lancer la partie
        </button>
      </section>
    </main>
  );
}

export default function App() {
  const [game, setGame] = useState<GameState | null>(null);
  const [selectedOwnSetIndex, setSelectedOwnSetIndex] = useState(0);
  const [targetingCard, setTargetingCard] = useState<CardInstance | null>(null);

  const activePlayer = game?.players[game.currentPlayerIndex];
  const validTargets = game && targetingCard ? getPlayableTargets(game, targetingCard) : [];

  if (!game || !activePlayer) {
    return <ConfigScreen onStart={(playerCount, mode, targetScore) => {
      const nextGame = createGame({ playerCount, mode, targetScore });
      setSelectedOwnSetIndex(0);
      setTargetingCard(null);
      setGame(nextGame);
    }} />;
  }

  const send = (next: GameState) => {
    setSelectedOwnSetIndex(current => Math.min(current, next.players[next.currentPlayerIndex].sets.length - 1));
    setTargetingCard(null);
    setGame(next);
  };

  const targetSlot = (targetPlayerId: string, targetSetIndex: number) => {
    if (!targetingCard) return;
    if (targetingCard.cardId === 'smoke_me') {
      send(dispatchGameAction(game, {
        type: 'try_smoke',
        playerId: activePlayer.id,
        targetPlayerId,
        targetSetIndex,
      }));
      return;
    }

    send(dispatchGameAction(game, {
      type: 'play_card',
      cardInstanceId: targetingCard.instanceId,
      targetPlayerId,
      targetSetIndex,
    }));
  };

  const winner = game.winnerId ? game.players.find(player => player.id === game.winnerId) : undefined;
  const liveMessage = targetingCard
    ? `Choisis un slot pour ${targetingCard.name}. ${activePlayer.isJunky ? 'Le Junky peut jouer chez les autres.' : 'Rien ne part sans cible.'}`
    : game.status === 'finished' && winner ? `${winner.name} gagne. Relance obligatoire.` : game.tableMessage;

  return (
    <main className="game-screen">
      <header className="topbar">
        <div>
          <p className="kicker">HERE, WE DON'T SMOKE. IT'S PRO.HIBITED.</p>
          <h1>Pro.Hibited Online</h1>
        </div>
        <div className="score-strip">
          <span>Tour {game.turnNumber}</span>
          <span>{game.config.mode === 'quick' ? 'Rapide' : 'Longue'} / {game.config.targetScore} pts</span>
          <button type="button" onClick={() => setGame(null)}>Nouvelle partie</button>
        </div>
      </header>

      <section className={`table-message ${game.status === 'finished' ? 'winner' : ''} ${targetingCard ? 'targeting' : ''}`}>
        {liveMessage}
      </section>

      <section className="board-grid">
        <div className="players-area">
          {game.players.map((player, index) => (
            <PlayerPanel
              key={player.id}
              player={player}
              active={index === game.currentPlayerIndex}
              selectedOwnSetIndex={selectedOwnSetIndex}
              onSelectOwnSet={setSelectedOwnSetIndex}
              targetingCard={targetingCard}
              validTargets={validTargets}
              onTargetSlot={targetSlot}
            />
          ))}
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
            <button type="button" onClick={() => send(dispatchGameAction(game, { type: 'end_turn' }))}>Finir le tour</button>
          </div>
        </div>

        <div className="hand-grid">
          {activePlayer.hand.map(card => {
            const targetMode = shouldUseTargetMode(activePlayer, card);
            const targetCount = getPlayableTargets(game, card).length;
            const disabled = targetMode
              ? targetCount === 0 || Boolean(targetingCard && targetingCard.instanceId !== card.instanceId)
              : Boolean(targetingCard) || !canPlayCard(game, card, activePlayer.id, selectedOwnSetIndex);
            return (
              <CardButton
                key={card.instanceId}
                card={card}
                targetMode={targetMode}
                pending={targetingCard?.instanceId === card.instanceId}
                disabled={disabled}
                onPlay={() => targetMode
                  ? setTargetingCard(card)
                  : send(dispatchGameAction(game, {
                    type: 'play_card',
                    cardInstanceId: card.instanceId,
                    targetPlayerId: activePlayer.id,
                    targetSetIndex: selectedOwnSetIndex,
                  }))}
                onDiscard={() => send(dispatchGameAction(game, { type: 'discard_card', cardInstanceId: card.instanceId }))}
              />
            );
          })}
        </div>
      </section>
    </main>
  );
}
