# Crypto Portfolio Tracker — Frontend

Interface web (SPA) d'un suivi de portefeuille multi-actifs : crypto, actions, ETF et or. Elle consomme une API Laravel (dépôt séparé) et permet de :

- tenir un **journal d'achats / ventes** par position et suivre les **plus-values** latentes et réalisées ;
- voir l'**évolution de la valeur** du portefeuille (7 j, 30 j, 90 j, 1 an) ;
- comparer la **répartition** actuelle à des objectifs, avec rééquilibrage et simulation d'apport ;
- créer des **alertes** (prix, variation, total du portefeuille, écart d'allocation), y compris **en langage naturel**, envoyées par email ou Discord ;
- suivre le **marché** : Fear & Greed Index, plus fortes hausses et baisses, actualités ;
- gérer un **catalogue partagé** d'actifs et de plateformes, avec logos ;
- afficher tous les montants dans la **devise de son choix** (USD, EUR, GBP, CHF).

L'interface est entièrement en français.

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
| Hébergement | Vercel (avec Vercel Analytics et Speed Insights) |

Les graphiques (sparklines, historique de prix, courbe du portefeuille) sont en SVG fait main : aucune bibliothèque de graphiques.

## Démarrage

Prérequis : Node.js 20.19+ ou 22.12+ (exigence de Vite 8), et l'API Laravel qui tourne sur `http://localhost:8000`.

```bash
npm install
npm run dev        # http://localhost:5173
```

Aucune variable d'environnement n'est nécessaire côté front. Le serveur de dev proxifie `/backend/*` vers `http://localhost:8000/*` (voir `vite.config.ts`). Le front parle donc toujours à la même origine, en dev comme en prod.

Côté backend, `FRONTEND_URL` doit pointer vers `http://localhost:5173` : les liens de vérification d'email et de réinitialisation du mot de passe redirigent vers le front.

### Scripts

| Commande | Effet |
| --- | --- |
| `npm run dev` | Serveur de dev Vite avec HMR et proxy `/backend` |
| `npm run build` | Vérification de types (`tsc -b`) puis build de production dans `dist/` |
| `npm run preview` | Sert le build localement (sans proxy `/backend`, donc sans API) |
| `npm run lint` | oxlint |

Il n'y a pas de suite de tests automatisés.

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
│   ├── layout/            # AppShell, en-tête, pied de page, menu utilisateur
│   └── *.tsx              # Composants métier partagés (graphiques, montants, logos…)
└── features/<feature>/    # Une feature par dossier :
    ├── api.ts             #   appels HTTP bruts (une fonction par endpoint)
    ├── hooks.ts           #   hooks TanStack Query (clés, invalidations)
    ├── schemas.ts         #   schémas Zod des formulaires
    └── *Page.tsx, *Dialog.tsx
```

Un composant ne fait jamais d'appel HTTP lui-même. Il passe par `hooks.ts`, qui passe par `api.ts`, qui passe par `lib/http-client.ts`.

## Routes

| Chemin | Écran | Accès |
| --- | --- | --- |
| `/login`, `/register`, `/forgot-password`, `/reset-password` | Authentification | Déconnecté uniquement |
| `/` | Portefeuille | Connecté et email vérifié |
| `/assets/:id` | Détail d'un actif | idem |
| `/allocation` | Répartition et objectifs | idem |
| `/market` | Marché | idem |
| `/alerts` | Alertes et notifications | idem |
| `/audit` | Historique des actions | idem |
| `/catalog` | Catalogue d'actifs et de plateformes | idem |
| `/account` | Compte | idem |
| `/mentions-legales`, `/confidentialite` | Pages légales | Public |

## Documentation détaillée

- [Architecture](docs/architecture.md) : couche HTTP, authentification Sanctum, cache et invalidations, providers, gestion d'erreurs, sécurité.
- [Déploiement](docs/deployment.md) : Vercel, proxy `/backend`, en-têtes de sécurité, CSP.
- [Contrat API et particularités du backend](docs/api-contract.md) : conventions, pièges connus et contournements côté front.
- Features :
  - [Authentification](docs/features/auth.md)
  - [Portefeuille, transactions et historique](docs/features/portfolio.md)
  - [Répartition et objectifs](docs/features/allocation.md)
  - [Alertes et notifications](docs/features/alerts.md)
  - [Catalogue (actifs, plateformes, logos)](docs/features/catalog.md)
  - [Marché et détail d'un actif](docs/features/market-and-assets.md)
  - [Compte](docs/features/account.md)
  - [Historique (audit)](docs/features/audit.md)
  - [Tutoriel, nouveautés et thème](docs/features/onboarding-and-ui.md)
