# 08 — Prompt Prototype V0

Crée un prototype web React + Vite + TypeScript + Tailwind pour un jeu de cartes nommé **Pro.Hibited Online**.

## Concept

Pro.Hibited n’est pas un jeu où l’on fume. C’est un jeu où les joueurs tentent de compléter un set interdit, mais le système et les autres joueurs les sabotent. Le slogan est :

> HERE, WE DON’T SMOKE. IT’S PRO.HIBITED.

## Objectif V0

Créer un prototype local jouable dans le navigateur, sans backend, avec 2 à 5 joueurs simulés.

## Cartes

Produits :

- Weed
- Hash
- CBD

Construction :

- Filter
- Paper
- Fire
- BBQ
- Bong
- Blunt
- Smoke Me

Attaques :

- Wind
- Rain
- Lost
- Cops

## Combos valides

1. Produit + Filter + Paper + Fire + Smoke Me
2. Produit + Filter + Paper + BBQ + Smoke Me
3. Produit + Bong + Fire + Smoke Me
4. Produit + Bong + BBQ + Smoke Me
5. Produit + Blunt + Fire + Smoke Me
6. Produit + Blunt + BBQ + Smoke Me

## Règles

- Smoke Me ne peut être joué que si le set est complet.
- Si Smoke Me n’est pas jouable, afficher “Still Pro.Hibited.”
- Wind retire la dernière carte posée du set ciblé.
- Rain retire la dernière carte posée du set ciblé.
- Bong, Blunt et BBQ nécessitent 2 attaques Wind/Rain pour être défaussés.
- Lost détruit entièrement le set ciblé.
- Cops détruit entièrement un set contenant Weed ou Hash.
- Cops ne fait rien contre un set contenant CBD.
- Les cartes doivent être stockées dans l’ordre de pose.

## Gameplay V0

- 2 à 5 joueurs configurables.
- Chaque joueur commence avec 5 cartes.
- À son tour, un joueur pioche 1 carte.
- Il peut jouer jusqu’à 2 cartes.
- Maximum 7 cartes en main.
- La pioche est commune.
- La défausse est commune.
- Le joueur actif est clairement affiché.

## Interface

- Design fun, cartoon, vert sombre, rouge, jaune, rose.
- Cartes très lisibles.
- Types de cartes avec couleurs distinctes.
- Sets des joueurs visibles.
- Main du joueur actif visible.
- Log d’événements humoristique.
- Gros message de refus : “HERE, WE DON’T SMOKE. IT’S PRO.HIBITED.”
- Validation : “Exception granted. You became Junky.”

## Code

Créer des types TypeScript propres :

- Card
- Player
- GameState
- GameAction

Créer un moteur dans `/src/game`, séparé des composants React.

Fonctions attendues :

- createDeck()
- shuffleDeck()
- dealCards()
- canPlayCard()
- isSetComplete()
- applyWindOrRain()
- applyLost()
- applyCops()
- trySmoke()
- nextTurn()

## Livrable

Un prototype jouable dans le navigateur permettant de tester une partie complète locale, avec une interface simple mais vivante.
