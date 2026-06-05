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

type AttackTarget = { playerId: string; setIndex: number };

function setLabel(set: SetCard[], index: number): string {
  return set.length === 0 ? `Slot ${index + 1}` : `Slot ${index + 1} / ${set.length}`;
}

function getAttackTargets(state: GameState): AttackTarget[] {
  const activeId = state.players[state.currentPlayerIndex].id;
  return state.players
    .filter(player => player.id !== activeId)
    .flatMap(player => player.sets
      .map((set, setIndex) => ({ playerId: player.id, setIndex, playable: set.length > 0 }))
      .filter(target => target.playable)
      .map(({ playerId, setIndex }) => ({ playerId, setIndex })));
}

function CardButton({ card, disabled, pending, onPlay, onDiscard }: {
  card: CardInstance;
  disabled: boolean;
  pending?: boolean;
  onPlay: () => void;
  onDiscard: () => void;
}) {
  const playLabel = card.family === 'attack' ? 'Cibler' : 'Jouer';
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

function PlayerPanel({ player, active, selectedOwnSetIndex, onSelectOwnSet, attackMode, onAttackSlot }: {
  player: Player;
  active: boolean;
  selectedOwnSetIndex: number;
  onSelectOwnSet: (setIndex: number) => void;
  attackMode: boolean;
  onAttackSlot: (playerId: string, setIndex: number) => void;
}) {
  return (
    <section className={`player-panel ${active ? 'active' : ''} ${attackMode && !active ? 'targeting' : ''}`}>
      <div className="player-heading">
        <h3>{player.name}</h3>
        <span>{player.score} pts</span>
      </div>
      <div className="sets-grid">
        {player.sets.map((set, index) => {
          const canTarget = attackMode && !active && set.length > 0;
          return (
            <SetSlotView
              key={`${player.id}-${index}`}
              set={set}
              index={index}
              selectable={active || canTarget}
              selected={active && selectedOwnSetIndex === index}
              attackable={canTarget}
              onSelect={() => canTarget ? onAttackSlot(player.id, index) : onSelectOwnSet(index)}
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
        <p className="kicker">Prototype local V0.2</p>
        <h1>Pro.Hibited Online</h1>
        <p>Construis plusieurs sets, cible le bon slot, tente le Smoke Me. Le systeme dira non jusqu'a preuve du contraire.</p>
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
  const [pendingAttack, setPendingAttack] = useState<CardInstance | null>(null);

  const activePlayer = game?.players[game.currentPlayerIndex];
  const attackTargets = game ? getAttackTargets(game) : [];

  if (!game || !activePlayer) {
    return <ConfigScreen onStart={(playerCount, mode, targetScore) => {
      const nextGame = createGame({ playerCount, mode, targetScore });
      setSelectedOwnSetIndex(0);
      setPendingAttack(null);
      setGame(nextGame);
    }} />;
  }

  const send = (next: GameState) => {
    setSelectedOwnSetIndex(current => Math.min(current, next.players[next.currentPlayerIndex].sets.length - 1));
    setPendingAttack(null);
    setGame(next);
  };

  const attackSlot = (targetPlayerId: string, targetSetIndex: number) => {
    if (!pendingAttack) return;
    send(dispatchGameAction(game, {
      type: 'play_card',
      cardInstanceId: pendingAttack.instanceId,
      targetPlayerId,
      targetSetIndex,
    }));
  };

  const winner = game.winnerId ? game.players.find(player => player.id === game.winnerId) : undefined;

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

      <section className={`table-message ${game.status === 'finished' ? 'winner' : ''} ${pendingAttack ? 'targeting' : ''}`}>
        {pendingAttack
          ? `Choisis une cible pour ${pendingAttack.name}. Rien ne part sans cible, c'est presque professionnel.`
          : game.status === 'finished' && winner ? `${winner.name} gagne. Relance obligatoire.` : game.tableMessage}
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
              attackMode={Boolean(pendingAttack)}
              onAttackSlot={attackSlot}
            />
          ))}
        </div>

        <aside className="side-panel">
          <h2>{pendingAttack ? `Cibles pour ${pendingAttack.name}` : 'Ciblage'}</h2>
          {pendingAttack ? (
            <div className="targeting-help">
              <p>Tape un slot adverse surligné pour résoudre l'attaque.</p>
              <button type="button" onClick={() => setPendingAttack(null)}>Annuler attaque</button>
              {attackTargets.length === 0 && <p>Aucun slot adverse attaquable. Le chaos attendra.</p>}
            </div>
          ) : (
            <p className="muted">Sélectionne une carte d'attaque pour choisir ensuite le joueur et le slot ciblés.</p>
          )}

          <h2>Log</h2>
          <ol className="event-log">
            {game.eventLog.map((line, index) => <li key={`${line}-${index}`}>{line}</li>)}
          </ol>
        </aside>
      </section>

      <section className="hand-panel">
        <div className="hand-heading">
          <div>
            <p className="kicker">Joueur actif</p>
            <h2>{activePlayer.name} / Slot {selectedOwnSetIndex + 1}</h2>
          </div>
          <div className="turn-actions">
            <span>{game.discardedThisTurn}/2 defausses</span>
            {pendingAttack && <button type="button" className="cancel-button" onClick={() => setPendingAttack(null)}>Annuler attaque</button>}
            <button type="button" onClick={() => send(dispatchGameAction(game, { type: 'try_smoke', playerId: activePlayer.id, targetSetIndex: selectedOwnSetIndex }))}>Smoke Me</button>
            <button type="button" onClick={() => send(dispatchGameAction(game, { type: 'end_turn' }))}>Finir le tour</button>
          </div>
        </div>

        <div className="hand-grid">
          {activePlayer.hand.map(card => {
            const isAttack = card.family === 'attack';
            const disabled = isAttack
              ? attackTargets.length === 0 || Boolean(pendingAttack && pendingAttack.instanceId !== card.instanceId)
              : Boolean(pendingAttack) || !canPlayCard(game, card, undefined, selectedOwnSetIndex);
            return (
              <CardButton
                key={card.instanceId}
                card={card}
                pending={pendingAttack?.instanceId === card.instanceId}
                disabled={disabled}
                onPlay={() => isAttack
                  ? setPendingAttack(card)
                  : send(dispatchGameAction(game, {
                    type: 'play_card',
                    cardInstanceId: card.instanceId,
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
