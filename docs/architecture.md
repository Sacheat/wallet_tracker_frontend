# Architecture

## Vue d'ensemble

```
Composant (Page / Dialog)
   │  useXxx()                      ← features/<f>/hooks.ts   (TanStack Query)
   ▼
fonction d'API                      ← features/<f>/api.ts     (une fonction par endpoint)
   │
   ▼
httpClient (axios)                  ← lib/http-client.ts      (CSRF, 419, 401)
   │  /backend/...
   ▼
proxy Vite (dev) / NGINX (prod)  →  API Laravel
```

Ordre des providers (`src/App.tsx`) :

```
ThemeProvider
└── QueryClientProvider
    └── AuthProvider          ← session, login/logout, purge du cache
        └── CurrencyProvider  ← devise de l'utilisateur, taux de change
            └── OnboardingProvider ← tutoriel guidé
                ├── OfflineBanner
                ├── AppRoutes (dans un ErrorBoundary par route)
                └── Toaster
```

## Couche HTTP — `lib/http-client.ts`

- **Base URL `/backend`, toujours la même origine.** En prod, NGINX transmet `/backend/*` à Laravel sur le même domaine ; en dev, Vite le proxifie vers `localhost:8000`. Le cookie de session Sanctum reste donc first-party, et le code du front est identique dans les deux cas. Voir [Déploiement](deployment.md).
- **CSRF automatique.** Avant toute requête qui n'est pas un GET, un intercepteur appelle `GET /sanctum/csrf-cookie`. L'appel est mémoïsé : plusieurs mutations simultanées ne le déclenchent qu'une fois. axios renvoie ensuite le cookie `XSRF-TOKEN` dans l'en-tête `X-XSRF-TOKEN` (`withXSRFToken: true`).
- **419 (jeton CSRF expiré)** : le cookie est rafraîchi et la requête rejouée une fois, sans que l'utilisateur le voie.
- **401** : diffuse un événement `onUnauthenticated`. `AuthProvider` y est abonné et termine la session locale. `GET /user` fait exception : c'est la sonde de session, et son 401 veut simplement dire « déconnecté ».
- **`toApiError(error)`** normalise toute erreur en `{ message, errors?, status?, retryAfterSeconds? }`. `retryAfterSeconds` vient de l'en-tête `Retry-After` des 429. Il alimente les comptes à rebours (`lib/use-retry-after-countdown.ts`) sur « mot de passe oublié » et sur l'export de données.

## Cache serveur — TanStack Query

Configuration globale (`lib/query-client.ts`) :

- `staleTime` de 30 s par défaut, `refetchOnWindowFocus: false` et aucun `refetchInterval`. L'API limite à 60 requêtes/min par utilisateur : l'app ne fait jamais de polling.
- Retry : uniquement sur les erreurs réseau et 5xx (2 tentatives). Les 4xx ne sont jamais rejoués. Les mutations ne sont jamais rejouées.
- Les `QueryCache` et `MutationCache` globaux alimentent l'indicateur hors-ligne (voir plus bas).

### Clés de requête et invalidations

Les clés sont hiérarchiques, et l'invalidation par préfixe sert à rafraîchir tout ce qui dépend d'une écriture.

| Clé | Contenu |
| --- | --- |
| `["auth","me"]` | Utilisateur courant (`staleTime: Infinity`) |
| `["portfolio"]` | Vue valorisée (`/api/portfolio`) |
| `["portfolio","news"]` | Actualités du portefeuille |
| `["portfolio","history",range]` | Courbe de valeur |
| `["portfolio","allocation",contribution]` | Répartition |
| `["portfolio-entries"]` | Positions brutes |
| `["portfolio-entries",id,"transactions"]` | Journal d'une position |
| `["allocation-targets"]` | Objectifs de répartition |
| `["assets"]`, `["assets",id]`, `["assets",id,"details"]`, `["assets",id,"news"]` | Catalogue et détail d'actif |
| `["price-alerts"]`, `["notification-settings"]` | Alertes |
| `["audit-logs",scope,page]` | Journal d'audit |
| `["market","fear-greed-index"]`, `["market","exchange-rates"]` | Marché |

Un achat ou une vente invalide `["portfolio-entries"]` et `["portfolio"]`. Cela rafraîchit d'un coup les quantités, la valorisation, les plus-values, la courbe d'historique, la répartition et les journaux ouverts. C'est la raison pour laquelle l'historique et la répartition sont rangés sous `["portfolio"]`.

### Isolation entre comptes

Les clés ne contiennent pas l'id de l'utilisateur. `AuthProvider` vide donc **tout** le cache, sauf la requête d'auth, à chaque début et fin de session. Il prévient aussi les autres onglets via un `BroadcastChannel("wallet-tracker-auth")`, pour qu'un logout dans un onglet efface immédiatement le portefeuille affiché dans les autres.

## Providers

| Provider | Rôle |
| --- | --- |
| `AuthProvider` | `useAuth()` : `user`, `login`, `register`, `logout`, `endSession` (pour les flux qui tuent la session côté serveur : changement de mot de passe, suppression de compte). |
| `CurrencyProvider` | `useCurrency()` : `currency`, `convert(usd)`, `format(usd)`, `setCurrency`. Les taux ne sont chargés que si la devise n'est pas l'USD. `convert` renvoie `null` si le taux est indisponible, et l'UI affiche « — » plutôt qu'un chiffre faux. |
| `OnboardingProvider` | `useOnboarding().start()` lance le tutoriel. Voir [onboarding](features/onboarding-and-ui.md). |
| `ThemeProvider` | `light` / `dark` / `system`, stocké dans `localStorage["wallet-tracker-theme"]`. Un script inline dans `index.html` applique le thème avant le premier rendu, pour éviter un flash. |

### Règle des devises

L'app manipule deux sortes de montants, qui ne se convertissent pas de la même façon :

1. **Les montants « instantanés » en USD** (prix, valeur actuelle, répartition, seuils d'alerte) sont convertis avec le taux du jour via `useCurrency().format()`.
2. **Les montants historiques** (plus-values, coût de revient, courbe d'historique) sont calculés par le backend **séparément dans chaque devise**, chaque transaction étant convertie au taux de son propre jour. Le front lit directement la clé de la devise de l'utilisateur (`pickCurrency()` dans `features/portfolio/performance.ts`) et **ne convertit jamais** ces montants : il perdrait l'effet de change.

## Routage et gardes

- `PublicOnlyRoute` redirige un utilisateur connecté hors des pages d'auth.
- `ProtectedRoute` affiche un spinner pendant le chargement de la session, puis redirige vers `/login` (en gardant `from`) si l'utilisateur n'est pas connecté. Si `email_verified_at === null`, il affiche `VerifyEmailScreen` à la place de toute l'app, puisque chaque `/api/*` répondrait 403. Sinon, il rend `AppShell` et la page.
- Chaque route est enveloppée dans un `ErrorBoundary` dont la clé est le `pathname` : une page qui plante n'empêche pas de naviguer ailleurs.

## États vides, d'erreur et hors-ligne

- Les valeurs `null` de l'API (prix indisponible, description absente, pas d'actualité pour un actif non crypto…) sont des **états normaux**. Elles s'affichent comme telles (« — », message explicatif) et jamais comme des erreurs.
- `lib/offline-status.ts` est un mini-store externe (`useSyncExternalStore`). Il passe à « hors-ligne » quand une requête n'obtient **aucune réponse** (serveur injoignable, DNS, CORS) et revient en ligne au premier succès. `OfflineBanner` l'affiche. Le store ne s'appuie pas sur `navigator.onLine`, qui ne dit rien de la disponibilité de l'API.
- Dates : `lib/parse-date.ts` parse défensivement les dates de l'API, dont certaines arrivent sous forme d'objet Carbon sérialisé (voir [contrat API](api-contract.md)).

## Sécurité côté front

| Mesure | Où |
| --- | --- |
| Filtrage des URL venant de l'API : `safeLinkUrl` n'accepte que http(s), `safeImageUrl` que la même origine, `blob:` ou https | `lib/safe-url.ts` |
| Échappement des cellules CSV commençant par `= + - @` (injection de formules) | `lib/csv.ts` |
| CSP générée au build, avec le hash du script inline de thème | `vite.config.ts` |
| En-têtes HSTS, `frame-ancestors 'none'`, nosniff, Permissions-Policy, COOP | NGINX, voir [Déploiement](deployment.md#en-têtes-de-sécurité) |
| Validation client des uploads (type, poids, dimensions), qui double celle du backend | `lib/logo-upload.ts`, `AvatarCropDialog.tsx` |
| `is_admin` ne sert qu'à afficher ou masquer des contrôles. Le backend reste seul juge (403). | `features/audit`, `features/catalog` |
| URL du webhook Discord masquée par défaut (c'est un secret) | `NotificationSettingsCard.tsx` |

## Conventions

- Alias `@/` vers `src/`.
- Les types de l'API vivent uniquement dans `src/types/api.ts`. Les décimaux Laravel (`quantity`, `threshold`, `unit_price`…) sont typés `string` et convertis avec `Number()` au moment de l'usage.
- Les schémas Zod reprennent les bornes du backend (quantité ≤ 999 999 999 999, mot de passe de 15 à 64 caractères, date ≥ 04/01/1999…) pour donner un retour immédiat. Le backend reste la validation de référence, et ses erreurs 422 (`errors.<champ>`) sont replacées sur les champs du formulaire.
- Formatage `fr-FR` partout. L'espace fine insécable de `Intl` est remplacée par une espace insécable visible (`lib/format.ts`, `lib/currency.ts`).
- `components/ui/` contient du code généré par shadcn (`components.json`, style `base-nova`). Il ne faut pas y mettre de logique métier.
