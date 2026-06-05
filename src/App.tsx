import { useMemo, useState } from 'react';
import { canPlayCard, createGame, dispatchGameAction } from './game/engine';
import type { CardFamily, CardInstance, GameMode, GameState, LongTargetScore, Player } from './game/types';

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

function firstTargetFor(state: GameState): string | undefined {
  const activeId = state.players[state.currentPlayerIndex].id;
  return state.players.find(player => player.id !== activeId && player.set.length > 0)?.id;
}

function CardButton({ card, disabled, onPlay, onDiscard }: {
  card: CardInstance;
  disabled: boolean;
  onPlay: () => void;
  onDiscard: () => void;
}) {
  return (
    <article className={`card card-${card.family}`}>
      <div className="card-topline">
        <span>{familyLabels[card.family]}</span>
        <strong>{card.name}</strong>
      </div>
      <p>{card.effect}</p>
      <div className="card-actions">
        <button type="button" onClick={onPlay} disabled={disabled}>Jouer</button>
        <button type="button" className="ghost" onClick={onDiscard}>Defausser</button>
      </div>
    </article>
  );
}

function PlayerPanel({ player, active }: { player: Player; active: boolean }) {
  return (
    <section className={`player-panel ${active ? 'active' : ''}`}>
      <div className="player-heading">
        <h3>{player.name}</h3>
        <span>{player.score} pts</span>
      </div>
      <div className="set-row">
        {player.set.length === 0 ? <span className="empty-set">Set vide</span> : player.set.map(card => (
          <span key={card.instanceId} className={`set-card set-${card.family}`}>
            {card.name}{card.attackMarks > 0 ? ` x${card.attackMarks}` : ''}
          </span>
        ))}
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
        <p className="kicker">Prototype local V0</p>
        <h1>Pro.Hibited Online</h1>
        <p>Construis ton set, subis les sabotages, tente le Smoke Me. Le systeme dira non jusqu'a preuve du contraire.</p>
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
  const [selectedTargetId, setSelectedTargetId] = useState<string | undefined>();

  const activePlayer = game?.players[game.currentPlayerIndex];
  const availableTargetId = useMemo(() => game ? firstTargetFor(game) : undefined, [game]);
  const targetId = selectedTargetId ?? availableTargetId;

  if (!game || !activePlayer) {
    return <ConfigScreen onStart={(playerCount, mode, targetScore) => {
      const nextGame = createGame({ playerCount, mode, targetScore });
      setSelectedTargetId(firstTargetFor(nextGame));
      setGame(nextGame);
    }} />;
  }

  const send = (next: GameState) => {
    setSelectedTargetId(firstTargetFor(next));
    setGame(next);
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

      <section className={`table-message ${game.status === 'finished' ? 'winner' : ''}`}>
        {game.status === 'finished' && winner ? `${winner.name} gagne. Relance obligatoire.` : game.tableMessage}
      </section>

      <section className="board-grid">
        <div className="players-area">
          {game.players.map((player, index) => (
            <PlayerPanel key={player.id} player={player} active={index === game.currentPlayerIndex} />
          ))}
        </div>

        <aside className="side-panel">
          <h2>Cible</h2>
          <div className="target-list">
            {game.players.filter(player => player.id !== activePlayer.id).map(player => (
              <label key={player.id} className={player.id === targetId ? 'target selected' : 'target'}>
                <input
                  type="radio"
                  name="target"
                  value={player.id}
                  checked={player.id === targetId}
                  onChange={() => setSelectedTargetId(player.id)}
                />
                <span>{player.name}</span>
                <small>{player.set.length} cartes</small>
              </label>
            ))}
          </div>

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
            <h2>{activePlayer.name}</h2>
          </div>
          <div className="turn-actions">
            <span>{game.discardedThisTurn}/2 defausses</span>
            <button type="button" onClick={() => send(dispatchGameAction(game, { type: 'try_smoke', playerId: activePlayer.id }))}>Smoke Me</button>
            <button type="button" onClick={() => send(dispatchGameAction(game, { type: 'end_turn' }))}>Finir le tour</button>
          </div>
        </div>

        <div className="hand-grid">
          {activePlayer.hand.map(card => {
            const nextTarget = card.family === 'attack' ? targetId : undefined;
            return (
              <CardButton
                key={card.instanceId}
                card={card}
                disabled={!canPlayCard(game, card, nextTarget)}
                onPlay={() => send(dispatchGameAction(game, { type: 'play_card', cardInstanceId: card.instanceId, targetPlayerId: nextTarget }))}
                onDiscard={() => send(dispatchGameAction(game, { type: 'discard_card', cardInstanceId: card.instanceId }))}
              />
            );
          })}
        </div>
      </section>
    </main>
  );
}
