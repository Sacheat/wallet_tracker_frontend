# Marché et détail d'un actif

## Page Marché — `/market`

Dossier : `src/features/market/`.

| Bloc | Source | Notes |
| --- | --- | --- |
| `AllocationBar` | `/api/portfolio` | Répartition par type d'actif (cible du tutoriel) |
| `FearGreedGauge` | `GET /api/market/fear-greed-index` | Crypto uniquement. Peut renvoyer 503 : pas de nouvelle tentative, état indisponible. Cache de 15 min. |
| `PortfolioMoversCard` | `/api/assets/{id}/details` de chaque actif détenu | Les 3 plus fortes hausses et les 3 plus fortes baisses sur 24 h. Ce n'est pas un endpoint dédié : le classement est fait côté front. |
| `PortfolioNewsCard` | `GET /api/portfolio/news` | Actualités des cryptos détenues. Liens filtrés par `safeLinkUrl()`. |

- Un bandeau prévient quand l'utilisateur détient des actifs non crypto, qui ne sont couverts ni par l'indice ni par les actualités. Il cite ces actifs par leur nom.
- Le bouton « Actualiser » invalide les clés marché, portefeuille, actualités et actifs. Il n'y a pas de rafraîchissement automatique.

### Détail des blocs

**Répartition (`AllocationBar`).** Calculée côté front à partir des `value_usd` de `/api/portfolio`, et non avec `/api/allocation` : la donnée est déjà en cache pour la page Portefeuille. Les segments suivent l'ordre fixe `ASSET_TYPE_ORDER` (une couleur par type, toujours la même), la légende est triée par valeur décroissante. Un lien mène à la page [Répartition](allocation.md) pour les objectifs.

**Fear & Greed (`FearGreedGauge`).** Valeur sur 100 et classification renvoyée par l'API (« Greed », « Fear »…). La barre est verte si la classification contient « greed », rouge si elle contient « fear », grise sinon.

**Mouvements 24 h (`PortfolioMoversCard`, `usePortfolioMovers`).**

1. Les actifs distincts sont extraits de `/api/portfolio-entries`.
2. Les détails de chacun sont chargés en parallèle (`useQueries`), avec la même clé que la page de l'actif : ce qui est déjà en cache n'est pas redemandé.
3. Les actifs sans variation 24 h (`null`) sont écartés, puis le reste est trié : jusqu'à 3 hausses et 3 baisses.

Trois états vides distincts : aucune position, positions mais pas encore assez d'historique pour une variation 24 h (compte récent), ou aucune hausse / baisse dans une des deux colonnes.

**Actualités (`PortfolioNewsCard`).** Quand les actualités concernent plusieurs actifs, des boutons permettent de filtrer par symbole (« Tout », « BTC », « ETH »…). Le badge du symbole sur chaque actualité mène à la page de l'actif, s'il est détenu. Les dates passent par `parseApiDate()`.

### Taux de change

`GET /api/exchange-rates` (à la racine de `/api`, pas sous `/market`) renvoie `{ base: "USD", rates: { EUR, GBP, CHF } }`. Il est consommé par `CurrencyProvider`, uniquement si le compte n'est pas en USD, avec un cache de 5 min. Le backend partage le même cache de 45 s que `total_value_by_currency`, donc les deux sont cohérents.

## Détail d'un actif — `/assets/:id`

Dossier : `src/features/assets/` (`AssetDetailPage`).

- `GET /api/assets/{id}` pour l'identité, et `GET /api/assets/{id}/details` pour le prix, les variations 1 h / 24 h / 7 j, la capitalisation (crypto), la description (crypto) et `history_7d`.
- `GET /api/assets/{id}/news` : actualités, crypto uniquement (`[]` sinon).
- **Historique 7 jours** (`PriceHistoryChart`) : les points viennent de relevés horaires. Si la collecte a été interrompue et que les données couvrent moins de 2 jours, le graphique affiche un état « historique en construction » plutôt qu'une fausse tendance sur 7 jours (`lib/price-history.ts`).
- Les valeurs `null` (capitalisation, description, variations) sont normales et masquent simplement le bloc concerné.
- Les détails sont mis en cache 5 min sous `["assets",id,"details"]` et partagés avec le tableau du portefeuille et le bloc des plus fortes variations : pas de requête en double.
- Le prix est en USD et converti avec `useCurrency().format()`. Il s'anime d'une valeur à l'autre lors d'un rafraîchissement (`useAnimatedNumber`).
- Si les détails échouent, un message dédié s'affiche. Pour l'or, il précise que le cours vient d'une source non officielle, momentanément indisponible.
- Un id inconnu affiche « Actif introuvable ». Un lien ramène au portefeuille.
