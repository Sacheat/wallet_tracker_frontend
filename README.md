# Crypto Portfolio Tracker — Frontend

Interface web (SPA) d'un suivi de portefeuille multi-actifs : crypto, actions, ETF et or. Elle consomme une API Laravel (dépôt séparé) et permet de :

- tenir un **journal d'achats / ventes** par position et suivre les **plus-values** latentes et réalisées ([portefeuille](docs/features/portfolio.md)) ;
- voir l'**évolution de la valeur** du portefeuille sur 7 j, 30 j, 90 j ou 1 an ([historique de valeur](docs/features/portfolio.md#évolution-du-portefeuille--portfoliohistorycard)) ;
- comparer la **répartition** actuelle à des objectifs, avec rééquilibrage et simulation d'apport ([répartition](docs/features/allocation.md)) ;
- créer des **alertes** (prix, variation, total du portefeuille, écart d'allocation), y compris **en langage naturel**, envoyées par email ou Discord ([alertes](docs/features/alerts.md)) ;
- suivre le **marché** : Fear & Greed Index, plus fortes hausses et baisses, actualités ([marché](docs/features/market-and-assets.md)) ;
- gérer un **catalogue partagé** d'actifs et de plateformes, avec logos ([catalogue](docs/features/catalog.md)) ;
- afficher tous les montants dans la **devise de son choix** : USD, EUR, GBP ou CHF ([règle des devises](docs/architecture.md#règle-des-devises)).

L'interface est entièrement en français, avec thème clair / sombre, et s'adapte au mobile : sous 768 px, la navigation passe dans une barre d'onglets en bas de l'écran ([interface](docs/ui.md)).

## Stack

| Domaine | Choix |
| --- | --- |
| Build / dev | Vite 8, TypeScript 6 |
| UI | React 19, Tailwind CSS 4, composants shadcn/ui (base `@base-ui/react`), icônes lucide |
| Routage | React Router 7 |
| Données serveur | TanStack Query 5 + axios |
| Formulaires | react-hook-form + Zod 4 |
| Divers | sonner (toasts), driver.js (tutoriel), react-easy-crop (avatar), police Geist |
| Qualité | oxlint |
| Hébergement | VPS de l'école : NGINX sert le build et transmet `/backend/*` à l'API, sur le même domaine ([déploiement](docs/deployment.md)) |

Les graphiques (sparklines, historique de prix, courbe du portefeuille) sont en SVG fait main : aucune bibliothèque de graphiques.

## Démarrage

Prérequis : Node.js 20.19+ ou 22.12+ (exigence de Vite 8), et l'API Laravel qui tourne sur `http://localhost:8000`.

```bash
npm install
npm run dev        # http://localhost:5173
```

Aucune variable d'environnement n'est nécessaire côté front. Le serveur de dev proxifie `/backend/*` vers `http://localhost:8000/*` (voir `vite.config.ts`), comme NGINX le fait en production. Le front parle donc toujours à sa propre origine, en dev comme en prod.

Côté backend, `FRONTEND_URL` doit pointer vers `http://localhost:5173` : les liens de vérification d'email et de réinitialisation du mot de passe redirigent vers le front.

### Scripts

| Commande | Effet |
| --- | --- |
| `npm run dev` | Serveur de dev Vite avec HMR et proxy `/backend` |
| `npm run build` | Vérification de types (`tsc -b`) puis build de production dans `dist/` |
| `npm run preview` | Sert le build localement (sans proxy `/backend`, donc sans API) |
| `npm run lint` | oxlint |

Il n'y a pas de suite de tests automatisés. Pour vérifier un changement d'interface sur mobile, utiliser le mode responsive des outils de développement du navigateur (360 et 390 px de large sont de bons cas de test).

## Organisation du code

```
src/
├── main.tsx, App.tsx      # Point d'entrée, providers, table des routes
├── types/api.ts           # Types de toutes les réponses de l'API (source unique)
├── lib/                   # Client HTTP, QueryClient, formatage, devises, utilitaires
├── providers/             # Auth, Currency, Onboarding, Theme (contextes React)
├── routes/                # Gardes de routes (ProtectedRoute, PublicOnlyRoute), 404
├── components/
│   ├── ui/                # Primitives shadcn/ui (générées, peu modifiées)
│   ├── layout/            # AppShell (header, navigation mobile), pied de page, menus
│   └── *.tsx              # Composants métier partagés (graphiques, montants, logos…)
└── features/<feature>/    # Une feature par dossier :
    ├── api.ts             #   appels HTTP bruts (une fonction par endpoint)
    ├── hooks.ts           #   hooks TanStack Query (clés, invalidations)
    ├── schemas.ts         #   schémas Zod des formulaires
    └── *Page.tsx, *Dialog.tsx
```

Un composant ne fait jamais d'appel HTTP lui-même. Il passe par `hooks.ts`, qui passe par `api.ts`, qui passe par `lib/http-client.ts`. Le détail est dans [Architecture](docs/architecture.md).

## Routes

| Chemin | Écran | Accès | Doc |
| --- | --- | --- | --- |
| `/login`, `/register`, `/forgot-password`, `/reset-password` | Authentification | Déconnecté uniquement | [auth](docs/features/auth.md) |
| `/` | Portefeuille | Connecté et email vérifié | [portfolio](docs/features/portfolio.md) |
| `/assets/:id` | Détail d'un actif | idem | [market-and-assets](docs/features/market-and-assets.md#détail-dun-actif--assetsid) |
| `/allocation` | Répartition et objectifs | idem | [allocation](docs/features/allocation.md) |
| `/market` | Marché | idem | [market-and-assets](docs/features/market-and-assets.md) |
| `/alerts` | Alertes et notifications | idem | [alerts](docs/features/alerts.md) |
| `/audit` | Historique des actions | idem | [audit](docs/features/audit.md) |
| `/catalog` | Catalogue d'actifs et de plateformes | idem | [catalog](docs/features/catalog.md) |
| `/account` | Compte | idem | [account](docs/features/account.md) |
| `/mentions-legales`, `/confidentialite` | Pages légales | Public | [legal](docs/features/legal.md) |

## Documentation détaillée

Transverse :

- [Architecture](docs/architecture.md) : couche HTTP, authentification Sanctum, cache et invalidations, providers, règle des devises, gestion d'erreurs, sécurité.
- [Interface](docs/ui.md) : layout, navigation responsive et barre d'onglets mobile, couleurs, composants partagés, formatage.
- [Contrat API et particularités du backend](docs/api-contract.md) : conventions, codes d'erreur, limites de débit, pièges connus et contournements côté front.
- [Déploiement](docs/deployment.md) : build, configuration NGINX attendue sur le VPS, en-têtes de sécurité, CSP, réglages du backend, checklist de mise en production.

Par feature :

- [Authentification](docs/features/auth.md)
- [Portefeuille, transactions et historique](docs/features/portfolio.md)
- [Répartition et objectifs](docs/features/allocation.md)
- [Alertes et notifications](docs/features/alerts.md)
- [Catalogue (actifs, plateformes, logos)](docs/features/catalog.md)
- [Marché et détail d'un actif](docs/features/market-and-assets.md)
- [Compte](docs/features/account.md)
- [Historique (audit)](docs/features/audit.md)
- [Tutoriel, nouveautés et thème](docs/features/onboarding-and-ui.md)
- [Pages légales](docs/features/legal.md)
