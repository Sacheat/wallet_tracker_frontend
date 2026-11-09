# Marché et détail d'un actif

## Page Marché — `/market`

Dossier : `src/features/market/`.

| Bloc | Source | Notes |
| --- | --- | --- |
| `AllocationBar` | `/api/portfolio` | Répartition par type d'actif (cible du tutoriel) |
| `FearGreedGauge` | `GET /api/market/fear-greed-index` | Crypto uniquement. Peut renvoyer 503 : pas de nouvelle tentative, état indisponible. Cache de 15 min. |
| `PortfolioMoversCard` | `/api/assets/{id}/details` de chaque actif détenu | Les 3 plus fortes hausses et les 3 plus fortes baisses sur 24 h. Ce n'est pas un endpoint dédié : le classement est fait côté front. |
| `PortfolioNewsCard` | `GET /api/portfolio/news` | Actualités des cryptos détenues. Liens filtrés par `safeLinkUrl()`. |

- Un bandeau prévient quand l'utilisateur détient des actifs non crypto, qui ne sont couverts ni par l'indice ni par les actualités.
- Le bouton « Actualiser » invalide les clés marché, portefeuille, actualités et actifs. Il n'y a pas de rafraîchissement automatique.

### Taux de change

`GET /api/exchange-rates` (à la racine de `/api`, pas sous `/market`) renvoie `{ base: "USD", rates: { EUR, GBP, CHF } }`. Il est consommé par `CurrencyProvider`, uniquement si le compte n'est pas en USD, avec un cache de 5 min. Le backend partage le même cache de 45 s que `total_value_by_currency`, donc les deux sont cohérents.

## Détail d'un actif — `/assets/:id`

Dossier : `src/features/assets/` (`AssetDetailPage`).

- `GET /api/assets/{id}` pour l'identité, et `GET /api/assets/{id}/details` pour le prix, les variations 1 h / 24 h / 7 j, la capitalisation (crypto), la description (crypto) et `history_7d`.
- `GET /api/assets/{id}/news` : actualités, crypto uniquement (`[]` sinon).
- **Historique 7 jours** (`PriceHistoryChart`) : les points viennent de relevés horaires. Si la collecte a été interrompue et que les données couvrent moins de 2 jours, le graphique affiche un état « historique en construction » plutôt qu'une fausse tendance sur 7 jours (`lib/price-history.ts`).
- Les valeurs `null` (capitalisation, description, variations) sont normales et masquent simplement le bloc concerné.
- Les détails sont mis en cache 5 min sous `["assets",id,"details"]` et partagés avec le tableau du portefeuille et le bloc des plus fortes variations : pas de requête en double.
