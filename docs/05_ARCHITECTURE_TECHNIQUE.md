# 05 — Architecture Technique

## Objectif

Créer d’abord un prototype local jouable, puis migrer vers un multijoueur en ligne.

## Stack recommandée

### Prototype local

- React
- Vite
- TypeScript
- Tailwind CSS
- Zustand pour état local
- Framer Motion pour animations

### Multijoueur V1

Option rapide :

- Supabase PostgreSQL
- Supabase Realtime
- Auth anonyme / pseudo temporaire

Option plus robuste jeu :

- Node.js
- Socket.IO
- Game engine serveur
- Redis optionnel

## Architecture de fichiers

```txt
src/
  components/
    CardView.tsx
    PlayerBoard.tsx
    Hand.tsx
    EventLog.tsx
    GameTable.tsx
  game/
    types.ts
    cards.ts
    deck.ts
    rules.ts
    engine.ts
  network/
    supabaseClient.ts
    rooms.ts
  pages/
    Home.tsx
    Lobby.tsx
    Game.tsx
```

## Principe fondamental

La logique de jeu doit rester séparée de React.

React affiche l’état. Le moteur de jeu reçoit des actions et retourne un nouvel état.

## Types principaux

- CardDefinition
- CardInstance
- SetCard
- Player
- GameState
- GameAction

## Moteur de règles

Fonctions minimales :

- createDeck()
- shuffleDeck()
- dealCards()
- isSetComplete()
- canPlayerSmoke()
- applyWindOrRain()
- applyLost()
- applyCops()
- trySmoke()
- nextTurn()

## Stockage des sets

Un set doit être une liste ordonnée, pas seulement des slots. Wind et Rain retirent la dernière carte posée.

```ts
set: SetCard[]
```

Chaque carte posée garde :

- instanceId
- cardId
- attackMarks
- playedOrder

## Multijoueur futur

### Supabase V1

Tables :

- rooms
- players
- game_states
- game_actions

Pour une V1 rapide, `game_states.state_json` peut stocker l’état complet. Pour une version sérieuse, les actions deviennent la source de vérité.

### Anti-triche futur

- Deck mélangé côté serveur.
- Mains adverses jamais envoyées aux autres clients.
- Actions validées côté serveur.
- Version d’état incrémentale.

## Déploiement

- GitHub repo : `benoitlub/prohibited-online`
- Hébergement prototype : GitHub Pages ou Netlify
- Backend V1 : Supabase
