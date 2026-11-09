# Portefeuille, transactions et historique

Dossier : `src/features/portfolio/`. Écran : `/` (`PortfolioPage`).

## Modèle de données

Le portefeuille est exposé par **deux surfaces distinctes**, qu'il ne faut pas confondre :

| Endpoint | Contenu | Usage |
| --- | --- | --- |
| `GET /api/portfolio-entries` | Positions brutes : id, quantité, relations `asset` et `platform` complètes (logo, symbole…) | Identité des lignes, liens, CRUD |
| `GET /api/portfolio` | Vue valorisée : `value_usd`/`value_eur` par ligne, totaux, `change_percent`, `performance` par devise, `positions_without_price` | Chiffres |

`useMergedPortfolio()` fait la **jointure sur l'`id` de position**. `usePortfolioTable()` y ajoute, pour chaque actif distinct, la variation 24 h et la sparkline 7 j (`/api/assets/{id}/details`, partagé en cache avec la page Marché), ainsi que la présence d'une alerte active.

Si `/api/portfolio` échoue, les lignes restent affichées sans valorisation (`isValuationUnavailable`). Seul un échec de `/api/portfolio-entries` est bloquant.

### Une position = un journal de transactions

Depuis le 08/11/2026, la quantité d'une position n'est plus modifiable directement : elle est **dérivée de ses transactions** (achats et ventes). `PATCH /api/portfolio-entries/{id}` n'a plus rien à modifier.

| Action | Endpoint |
| --- | --- |
| Ouvrir une position (avec son achat d'ouverture) | `POST /api/portfolio-entries` |
| Supprimer une position (et son journal) | `DELETE /api/portfolio-entries/{id}` |
| Lister le journal | `GET /api/portfolio-entries/{id}/transactions` |
| Ajouter un achat ou une vente | `POST /api/portfolio-entries/{id}/transactions` |
| Corriger une transaction | `PATCH /api/portfolio-transactions/{id}` |
| Supprimer une transaction | `DELETE /api/portfolio-transactions/{id}` |

Toute écriture invalide `["portfolio-entries"]` et `["portfolio"]`. Valorisation, plus-values, courbe, répartition et journaux ouverts se mettent donc à jour ensemble.

## Écran Portefeuille

- **Tuiles** : valeur totale (avec variation 1 h / 24 h / 7 j calculée par le backend) et plus-value latente / réalisée dans la devise du compte.
- **Tableau** : tri sur chaque colonne, recherche (actif, symbole, plateforme), regroupement par plateforme, export CSV (`portefeuille.csv`, protégé contre l'injection de formules).
- **Indicateurs par ligne** : cloche si une alerte est active sur l'actif, avertissement si le cours de l'or est indisponible, mention « Prix d'achat à renseigner » si une transaction n'a pas de prix.
- **Filtre « Prix d'achat à renseigner »** : proposé quand `positions_without_price > 0`. Il isole les positions exclues du calcul des plus-values.
- Un clic sur une ligne ouvre le [détail de l'actif](market-and-assets.md). Le menu « Actions » donne accès au journal et à la suppression.

### Plus-values

Elles sont calculées par le backend selon la méthode du **prix moyen pondéré**, frais inclus dans le coût de revient :

- `unrealized_pnl` / `unrealized_pnl_percent` : latente (`percent` vaut `null` si le coût de revient est nul, par exemple après un airdrop) ;
- `realized_pnl` : réalisée par les ventes. Une position entièrement vendue affiche sa plus-value réalisée ;
- `average_buy_price` : `null` une fois tout vendu.

Chaque montant existe **par devise** (`{ USD, EUR, GBP, CHF }`), calculé avec le taux de change du jour de chaque transaction. Le front lit la clé de la devise du compte via `pickCurrency()` et **ne convertit jamais** : convertir le chiffre USD au taux du jour ferait disparaître l'effet de change. Une clé absente s'affiche « — ».

`performance` vaut `null` sur une position tant qu'une de ses transactions n'a pas de prix unitaire. C'est le cas des positions migrées le 08/11/2026, dont l'achat d'ouverture n'a pas de prix.

## Ajouter une position — `AddPositionDialog`

- Choix de l'actif et de la plateforme dans le catalogue, puis saisie de la quantité. La paire (actif, plateforme) est unique par utilisateur.
- Section repliable « Achat d'ouverture », entièrement optionnelle : prix unitaire, frais, devise, date. Seuls les champs remplis sont envoyés, et le backend applique ses valeurs par défaut (frais 0, devise du compte, maintenant). Sans prix, la position est créée mais ses plus-values restent inconnues.
- Si le backend renvoie une erreur sur un champ de la section repliée, celle-ci s'ouvre automatiquement.

## Journal d'une position — `TransactionsDialog` et `TransactionForm`

- La liste et le formulaire s'affichent dans **le même dialogue** : pas de dialogues empilés.
- Les prix et frais s'affichent dans la devise de la transaction, tels que saisis, sans conversion.
- Création : type (achat / vente), quantité, prix unitaire **obligatoire** (0 est accepté pour un airdrop ou un don), frais, devise, date.
- Correction : seuls les champs modifiés sont envoyés. Renvoyer la date intacte remettrait l'heure à minuit et pourrait réordonner des écritures du même jour, ce qui ferait échouer la vérification chronologique des ventes.
- Le backend vérifie qu'**une vente ne dépasse jamais la quantité détenue à sa date**. Ajouter, corriger ou supprimer une transaction qui rendrait une vente ultérieure impossible renvoie un 422 explicite. Ses dates ISO sont reformatées par `frenchDates()`.
- Un 503 signifie que le taux de change du jour est indisponible : le backend refuse plutôt que d'enregistrer une plus-value fausse. Le formulaire garde ses valeurs pour qu'on puisse réessayer.

### Dates

`executed_at` est un jour calendaire stocké à minuit UTC. Les dates sont donc affichées en UTC (sinon on verrait la veille à l'ouest de Greenwich), et le maximum autorisé est « aujourd'hui en UTC » (`todayUtc()`). Le minimum est le 04/01/1999.

## Évolution du portefeuille — `PortfolioHistoryCard`

- `GET /api/portfolio/history?range=7d|30d|90d|1y`. Le backend met le résultat en cache 1 h, et le front 5 min. `keepPreviousData` laisse l'ancienne courbe (estompée) pendant le chargement d'une nouvelle période.
- Deux courbes, **valeur** et **montant investi**, lues dans la devise du compte sans conversion (`prepareHistory()`).
- Les jours de début où rien n'est détenu sont retirés, avec la note « Aucune position détenue avant le … ».
- La courbe « investi » est tracée par segments (`investedRuns()`) : un jour où le coût de revient est inconnu laisse un trou au lieu d'une fausse chute à 0.
- `missing_history` liste les actifs sans historique de prix. Ils sont exclus de la courbe et l'UI le signale.
- Graphique SVG maison (`PortfolioHistoryChart`), axes aux pas « ronds » (`niceTicks()`).

## Fichiers

| Fichier | Rôle |
| --- | --- |
| `api.ts` | Appels positions, transactions, vue valorisée, actualités, historique |
| `hooks.ts` | Clés, jointure `useMergedPortfolio`, `usePortfolioTable`, mutations |
| `performance.ts` | `pickCurrency()` |
| `history.ts` | Préparation des séries, segments, graduations |
| `schemas.ts` | Zod (position, transaction), `todayUtc`, `frenchDates`, bornes |
