# Version locale table layout

Dossier local contenant la version table/cartes vérifiée le 2026-06-07 :

`C:\Users\benoi\Documents\Codex\2026-06-07\objectif-mettre-en-place-le-layout\prohibited-online-main`

État local :

- layout table en place ;
- cartes 2025 utilisées depuis `src/assets/cards2025/*.png` ;
- dos de carte `src/assets/card-back.png` ;
- table vide `src/assets/empty-table.png` ;
- correction CSS finale : noms/scores placés dans les grands pads imprimés, sets placés sur les petits slots imprimés ;
- `npm run build` passe localement.

Limite du push depuis Codex dans cette session : le dossier local n'est pas un checkout Git (`.git` absent), `git`/`gh` ne sont pas disponibles dans le shell, et le connecteur GitHub doit recevoir le contenu des fichiers mais ne peut pas lire directement les assets binaires locaux par chemin. La branche est créée pour repère, mais la version complète doit être poussée depuis un vrai checkout Git ou depuis ce dossier après initialisation/remote.
