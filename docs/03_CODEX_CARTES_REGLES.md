# 03 — Codex Cartes & Règles Canoniques

## Objectif apparent

Construire un set complet puis jouer **Smoke Me**.

## Objectif réel

Tenter de valider malgré un système conçu pour empêcher les validations.

## Produits

- Weed
- Hash
- CBD

CBD est protégé contre **Cops**.

## Cartes de construction

- Filter
- Paper
- Fire
- BBQ
- Bong
- Blunt
- Smoke Me

## Cartes d’attaque

- Wind
- Rain
- Cops
- Lost

## Combos valides

### Combo classique

- Produit + Filter + Paper + Fire + Smoke Me
- Produit + Filter + Paper + BBQ + Smoke Me

### Combo contenant

- Produit + Bong + Fire + Smoke Me
- Produit + Bong + BBQ + Smoke Me
- Produit + Blunt + Fire + Smoke Me
- Produit + Blunt + BBQ + Smoke Me

## Règles de Smoke Me

Smoke Me est obligatoire pour valider.

Smoke Me n’est jouable que si le set est complet. Si le set est incomplet, l’interface affiche :

```txt
STILL PRO.HIBITED.
```

## Wind / Rain

Wind et Rain retirent la dernière carte posée du set ciblé.

### Résistance

Bong, Blunt et BBQ nécessitent deux attaques Wind/Rain pour être défaussés.

- 1ère attaque : marqueur d’attaque.
- 2e attaque : carte défaussée.

## Lost

Lost détruit entièrement le set ciblé. Toutes les cartes posées partent à la défausse.

## Cops

Cops détruit entièrement un set contenant Weed ou Hash.

Cops ne fait rien contre un set contenant CBD.

## Dons

Un joueur peut poser une carte compatible sur le set d’un autre joueur. Le set appartient toujours au joueur ciblé. Le don peut aider, piéger, accélérer ou préparer un vol par un Junky.

## Statut Junky

Le joueur qui réussit une validation devient Junky.

Dans la V0, cela peut simplement déclencher la victoire ou un badge. Dans la V1, le Junky peut obtenir des pouvoirs :

- compléter un set adverse avec ses propres cartes ;
- voler une validation avec Smoke Me ;
- faire un don toxique ;
- jouer sur le set d’un autre joueur une fois par tour.

## Ordre de résolution conseillé

1. Vérifier la validité de l’action.
2. Appliquer protections / résistances.
3. Résoudre attaque ou pose.
4. Mettre à jour la défausse.
5. Écrire le log humoristique.
6. Vérifier validation Smoke Me.
7. Changer de tour.
