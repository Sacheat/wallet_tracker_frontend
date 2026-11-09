# Contrat API et particularités du backend

La documentation de référence de l'API est tenue côté backend. Cette page ne liste que ce que le front doit savoir pour l'utiliser correctement, en particulier les écarts constatés en conditions réelles. Tous les types sont dans `src/types/api.ts`.

## Conventions générales

- **Deux préfixes.** Les routes de compte et de session (`/login`, `/register`, `/user`, `/user/*`, `/forgot-password`, `/reset-password`, `/email/*`, `/sanctum/csrf-cookie`) ne sont **pas** sous `/api`. Tout le reste l'est.
- **Décimaux en chaînes.** Laravel sérialise les colonnes décimales en `string` : `quantity`, `unit_price`, `fee`, `threshold`, `percent_threshold`, `price_usd` des points d'historique. Il faut les convertir avec `Number()` au moment de l'usage. Exception : `POST /api/price-alerts/parse` renvoie de vrais nombres.
- **Map vide = `[]`.** Quand PHP n'a rien à mettre dans un objet, il renvoie un tableau vide. Le cas a été observé sur `portfolio.performance` et `allocation-targets.targets`, et il est absorbé par `pickCurrency()` et `getAllocationTargets()`.
- **Enveloppes incohérentes.** Certaines collections sont enveloppées (`{ data: [...] }` : `/api/portfolio/news`, `/api/assets/search`, transactions), d'autres non (`/api/assets/{id}/news`, `/api/portfolio-entries`, `/api/price-alerts`). Le déballage est fait dans `api.ts`, jamais dans les composants.
- **Devises.** Les valeurs « instantanées » sont en USD. Les montants historiques (`performance`, `history`) sont fournis par devise (`{ USD, EUR, GBP, CHF }`) et ne se convertissent jamais. Voir [Architecture › Règle des devises](architecture.md#règle-des-devises).

## Codes d'erreur et réaction du front

| Code | Signification | Réaction |
| --- | --- | --- |
| 401 | Session absente ou expirée | Purge du cache, toast « session expirée », redirection vers `/login` |
| 403 | Email non vérifié, ressource d'un autre utilisateur, ou action catalogue réservée | Écran de vérification ; sinon `message` du backend affiché tel quel |
| 409 | Suppression bloquée (actif ou plateforme encore utilisés) | `message` du backend |
| 419 | Jeton CSRF expiré | Rafraîchi et requête rejouée automatiquement |
| 422 | Validation | `errors.<champ>` replacé sur le champ du formulaire |
| 429 | Limite de débit | Message avec `Retry-After`, compte à rebours quand c'est pertinent |
| 503 | Service tiers indisponible (taux de change, IA, Fear & Greed) | Message dédié, solution de repli si possible |

### Limites de débit

- `/api/*` : 60 requêtes/min par utilisateur. C'est pour cela que l'app ne fait aucun polling.
- `/login`, `/register`, `/forgot-password`, `/reset-password` : 5 requêtes/min par IP.
- `PATCH /user` et le renvoi de l'email de vérification : 6 requêtes/min.
- Créations dans le catalogue et routes `/logo` : 10 écritures/min par utilisateur.
- `GET /user/export` : 3 requêtes/min.

## Particularités connues et contournements

| Particularité | Contournement côté front |
| --- | --- |
| La réponse de `POST /register` omet `email_verified_at` (et d'autres champs). | Après register et login, on refait toujours `GET /user` (`fetchCanonicalUser()`). |
| `PATCH /user/password` invalide la session courante. | Traité comme un logout (`endSession()`) avec un message explicite. |
| `POST /reset-password` signale un jeton invalide dans `errors.email`, alors que le formulaire n'a pas de champ email. | Le message est affiché au niveau du formulaire. |
| `published_at` des actualités arrive parfois sous forme d'objet Carbon sérialisé. | `lib/parse-date.ts` ; `ErrorBoundary` par route. |
| Le `threshold` d'une alerte est saisi dans la devise du compte mais **renvoyé en USD**. | Reconverti pour l'affichage et pour préremplir l'édition. |
| `invested` vaut `{0,…}` (et non `null`) avant la première position. | Ces jours sont retirés du début de la courbe (`prepareHistory`). |
| Une date seule (`YYYY-MM-DD`) est lue comme minuit UTC et le futur est refusé. | Le max des sélecteurs de date est « aujourd'hui en UTC » (`todayUtc()`), et les dates s'affichent en UTC. |
| Les messages d'erreur du backend contiennent des dates ISO. | `frenchDates()` les reformate en JJ/MM/AAAA. |
| `Content-Disposition` de l'export n'est pas exposé. | Le front nomme le fichier `mes-donnees-AAAA-MM-JJ.json`. |
| `history_7d` peut couvrir bien moins de 7 jours (collecte horaire interrompue). | État « historique en construction » sous 2 jours de données (`isHistorySparse`). |
| Les cours de Yahoo Finance (actions, ETF, or) passent par un endpoint non officiel. | Affichage d'un état « indisponible » par ligne. |
| `logo_url` est refusé en écriture (422). | Upload séparé via `/logo`, voir [catalogue](features/catalog.md). |
