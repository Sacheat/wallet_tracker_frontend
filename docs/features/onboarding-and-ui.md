# Tutoriel, nouveautés et thème

## Tutoriel guidé

Fichiers : `src/providers/OnboardingProvider.tsx`, `src/features/onboarding/steps.ts`, `src/features/onboarding/tour.css`. Bibliothèque : driver.js.

### Déclenchement

- À la première connexion d'un utilisateur vérifié dont `onboarding_completed_at === null`, un toast propose la visite (« C'est parti » / « Non merci »). Le tutoriel n'est jamais lancé sans accord.
- Refuser, terminer ou fermer le tutoriel envoie `PATCH /user { onboarding_completed: true }`. Ignorer le toast le laisse réapparaître à la prochaine connexion.
- Le tutoriel peut être relancé depuis la page Compte (`useOnboarding().start()`).

### Fonctionnement

- Le tutoriel couvre plusieurs pages : chaque étape peut définir une `route`. Les boutons Suivant et Précédent naviguent d'abord vers cette route, puis driver.js attend jusqu'à 2 s que l'élément ciblé apparaisse (`waitForElement`). Un élément introuvable est sauté.
- Les éléments ciblés portent un attribut `data-tour="…"`. Si vous renommez ou déplacez l'un d'eux, mettez à jour `steps.ts` en même temps.

| `data-tour` | Composant |
| --- | --- |
| `add-position` | `AddPositionDialog` (déclencheur) |
| `market-allocation` | `AllocationBar` |
| `create-alert` | `CreateAlertDialog` (déclencheur) |
| `catalog-tabs` | `CatalogPage` |
| `currency-selector` | `CurrencySection` |

- Une étape `interactive: true` laisse l'élément cliquable : un vrai clic ferme le tutoriel pour que l'action de l'utilisateur, par exemple l'ouverture du dialogue d'ajout, ne soit pas recouverte par l'overlay.

## Nouveautés — `WhatsNewDialog`

`src/features/changelog/entries.ts` contient une liste **écrite pour l'utilisateur**, la plus récente en premier, et tenue à la main : seuls les changements qui méritent d'être annoncés y figurent, pas chaque commit.

> À compléter : les dernières fonctionnalités (journal d'achats et de ventes, plus-values, courbe d'historique, objectifs de répartition, alerte d'écart) n'y figurent pas encore.

## Thème

- `ThemeProvider` : `light`, `dark` ou `system`, stocké dans `localStorage["wallet-tracker-theme"]`. Le mode `system` suit `prefers-color-scheme` en direct.
- Un script inline dans `index.html` pose la classe `dark` avant le premier rendu, pour éviter un flash. Son hash est ajouté automatiquement à la CSP au build (voir [déploiement](../deployment.md)).
- Les couleurs sont des variables CSS définies dans `src/index.css` (Tailwind 4, shadcn).

## Autres éléments transverses

| Élément | Rôle |
| --- | --- |
| `AppShell`, `UserMenu`, `ThemeToggle`, `Footer` | Navigation principale, menu du compte, liens légaux |
| `OfflineBanner` | Bandeau affiché quand l'API est injoignable |
| `ErrorBoundary` | Un par route. Les détails techniques ne s'affichent qu'en dev. |
| Pages légales (`src/features/legal/`) | `/mentions-legales` et `/confidentialite`, accessibles connecté ou non. `PUBLICATION_MANAGER` est encore à renseigner. |
