# Répartition et objectifs

Dossier : `src/features/allocation/`. Écran : `/allocation` (`AllocationPage`).

## Endpoints

| Endpoint | Rôle |
| --- | --- |
| `GET /api/allocation[?contribution=X]` | Répartition par type d'actif, par plateforme et par actif. Avec des objectifs, ajoute l'écart (*drift*) et le rééquilibrage. |
| `GET /api/allocation-targets` | Objectifs par type d'actif, en % |
| `PUT /api/allocation-targets` | Remplace **tous** les objectifs d'un coup (`{}` les efface) |

Les montants de la réponse sont en USD et convertis avec le taux du jour (`useCurrency().format`). Contrairement aux plus-values et à l'historique, c'est correct ici : rien dans cet écran n'est historique. Le montant d'apport, lui, est saisi dans la devise du compte, et c'est le backend qui le convertit.

## Écran

- **Sans objectifs** : barres horizontales sur une échelle commune de 0 à 100 %, par type, par plateforme et par actif. L'ordre des types est fixe et ne change pas avec les valeurs, pour que chaque couleur garde son sens.
- **Avec objectifs** : pour chaque type, la part actuelle face à l'objectif, l'écart en points (`drift`, positif = surpondéré) et le montant à acheter ou vendre pour rééquilibrer à total constant (`rebalance_usd`, dont la somme vaut 0). Un type est signalé au-delà d'un seuil d'écart fixe. Ce seuil sert uniquement à l'affichage : l'alerte `allocation_drift` a son propre seuil, choisi par l'utilisateur.
- **Simulation d'apport** : un montant saisi relance la requête avec `?contribution=` (avec `keepPreviousData`) et affiche, pour chaque type, comment répartir cet apport (`contribution_usd`). Le champ n'est proposé qu'avec des objectifs, puisque le backend répondrait 422 sans eux. Il se vide si les objectifs sont effacés.

## Dialogue des objectifs — `TargetsDialog`

- Un champ en % par type (crypto, actions, ETF, or). Vide ou 0 veut dire 0 %, et ces valeurs ne sont pas envoyées.
- La somme s'affiche en direct, et l'enregistrement est bloqué tant qu'elle n'est pas à 100 % (tolérance de 0,01, la même que le backend : 33,33 + 33,33 + 33,34 passe).
- Au premier remplissage, la répartition actuelle est proposée comme point de départ, arrondie en entiers dont la somme fait exactement 100 (`roundTo100()`, méthode du plus fort reste).
- Après l'enregistrement, les objectifs sont mis en cache directement et toutes les variantes de `["portfolio","allocation",…]` sont invalidées.

## Lien avec les alertes

L'alerte `allocation_drift` (voir [alertes](alerts.md)) n'est proposée qu'une fois des objectifs définis. Effacer les objectifs **ne supprime pas** ces alertes, mais elles ne peuvent plus se déclencher : la page Alertes le signale et renvoie vers `/allocation`.
