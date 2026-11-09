# Interface : layout, responsive et composants partagés

Cette page décrit ce qui est commun à tous les écrans : la coquille de l'app, son comportement sur mobile, le système de couleurs et les composants réutilisés d'une feature à l'autre. Le thème clair / sombre, le tutoriel et la fenêtre « Quoi de neuf » sont dans [Tutoriel, nouveautés et thème](features/onboarding-and-ui.md).

## Coquille de l'app — `AppShell`

Fichiers : `src/components/layout/`.

Toutes les pages protégées sont rendues dans `AppShell` (par `ProtectedRoute`). Les pages d'authentification utilisent `AuthLayout`, et les pages légales `LegalLayout`.

```
┌ header (sticky) ─────────────────────────────────────┐
│ logo · Portfolio Tracker   [navigation]  thème  avatar│
└──────────────────────────────────────────────────────┘
  main (max-w-6xl, centré)
  Footer
  [barre d'onglets fixe en bas — mobile uniquement]
```

| Composant | Rôle |
| --- | --- |
| `AppShell` | Header, zone de contenu, pied de page et barre d'onglets mobile. La liste des liens (`NAV_ITEMS`) n'existe qu'à un endroit et sert aux deux navigations. |
| `ThemeToggle` | Menu Clair / Sombre / Système. L'icône reflète le choix, pas le thème résolu. |
| `UserMenu` | Avatar (initiales en repli), nom et email, lien vers `/account`, déconnexion. |
| `Footer` | Mentions légales, confidentialité, « Quoi de neuf » (ouvre `WhatsNewDialog`), lien `mailto:` de contact (`CONTACT_EMAIL`). |
| `FullPageSpinner` | Affiché par `ProtectedRoute` pendant la vérification de la session. |

### Navigation selon la largeur

| Largeur | Header | Navigation |
| --- | --- | --- |
| < 768 px (`md`) | Une ligne : logo, titre, thème, avatar | **Barre d'onglets fixe en bas** : 6 onglets, icône et libellé court, onglet actif en couleur primaire |
| 768 à 1023 px | Idem, avec la navigation au milieu | Dans le header, **icônes seules** (libellé en infobulle `title` et pour les lecteurs d'écran) |
| 1024 à 1279 px (`lg`) | Idem | Icônes et libellés |
| ≥ 1280 px (`xl`) | Nom de l'utilisateur affiché à côté de l'avatar | Icônes et libellés |

La barre du bas tient compte de la zone de l'encoche et de la barre d'accueil des iPhone (`pb-[env(safe-area-inset-bottom)]`), ce qui suppose `viewport-fit=cover` dans la balise `viewport` de `index.html`.

### `--bottom-nav-height`

La hauteur de la barre d'onglets est une variable CSS définie dans `src/index.css` : `calc(4rem + env(safe-area-inset-bottom))` sous 768 px, `0px` au-delà. Deux éléments s'en servent pour ne pas passer sous la barre :

- `AppShell`, qui ajoute cette hauteur en marge basse de la page (`pb-(--bottom-nav-height)`) ;
- le `Toaster` (`components/ui/sonner.tsx`), dont les décalages `offset` et `mobileOffset` l'ajoutent à leur marge basse.

Si la hauteur de la barre change, il suffit de modifier la variable : la page et les toasts suivent.

## Tableaux sur mobile

Les tableaux shadcn (`components/ui/table.tsx`) sont enveloppés dans un conteneur `overflow-x-auto` : un tableau trop large défile horizontalement au lieu de déborder de la page. Selon le tableau, trois approches sont utilisées pour éviter ce défilement sur petit écran :

| Écran | Approche sur mobile |
| --- | --- |
| Portefeuille | Le tableau (9 colonnes) est remplacé sous 768 px par une **liste de cartes** : actif, quantité et plateforme, variation 24 h, valeur, plus-value et menu d'actions. Voir [portefeuille](features/portfolio.md#écran-portefeuille). |
| Catalogue (actifs) | Colonnes secondaires masquées (`hidden sm:table-cell`, `hidden md:table-cell`) : le symbole passe sous le nom. |
| Historique (audit) | Date et heure sur deux lignes. Le tableau peut encore défiler légèrement. |

Pour un nouveau tableau, la règle est la même : garder sur mobile ce qui identifie la ligne et le chiffre principal, et masquer ou empiler le reste.

## Couleurs et design tokens

Les couleurs sont des variables CSS déclarées dans `src/index.css`, en deux jeux (`:root` pour le clair, `.dark` pour le sombre), puis exposées à Tailwind dans `@theme inline`. On utilise toujours les classes sémantiques (`bg-primary`, `text-muted-foreground`, `text-gain`…), jamais de couleur en dur.

| Token | Usage |
| --- | --- |
| `primary` | Violet de la marque (`#6C5CE7` en clair) : boutons principaux, onglet actif, liens |
| `gain` / `loss` | Hausse / baisse. Toujours accompagnés d'une flèche ou d'un signe, jamais la couleur seule. |
| `warning` | Avertissements (écart d'allocation, prix d'achat manquant) |
| `chart-1` à `chart-4` | Palette catégorielle des types d'actifs, dans un **ordre fixe** (`ASSET_TYPE_ORDER` : crypto, action, or, ETF). Une couleur ne change jamais de type d'actif, quel que soit le portefeuille. Les classes prêtes à l'emploi sont dans `lib/format.ts` : `ASSET_TYPE_CHART_CLASS` (fond plein) et `ASSET_TYPE_AVATAR_TONE` (fond teinté et texte, pour les monogrammes). |
| `accent-warm` | Orangé réservé au halo de la tuile principale (`.stat-hero`) et au contour animé IA |

Deux effets visuels sont volontairement limités à un seul usage chacun :

- **`.stat-hero`** : halo dégradé derrière la tuile « Valeur totale » du portefeuille et le prix d'un actif ;
- **`.ai-glow-border`** : contour en dégradé tournant autour du contenu généré par l'IA (l'aperçu d'une alerte en langage naturel). Il signale que ce bloc vient du modèle. L'animation est coupée si l'utilisateur a demandé à réduire les animations.

La police est Geist (variable), chargée via `@fontsource-variable/geist`, donc servie par l'app elle-même.

### Ne jamais construire une classe Tailwind dynamiquement

Tailwind ne génère que les classes qu'il trouve **écrites en entier** dans le code source. Une classe assemblée à l'exécution, comme `` `${ASSET_TYPE_CHART_CLASS[type]}/15` ``, n'existe pas dans le CSS final, sauf si elle apparaît par hasard ailleurs. C'est ce qui privait de fond les monogrammes des actions, de l'or et des ETF. Il faut passer par une table de correspondance qui contient les classes complètes, comme `ASSET_TYPE_AVATAR_TONE`.

## Composants partagés — `src/components/`

| Composant | Rôle | Points d'attention |
| --- | --- | --- |
| `StatTile` | Tuile de chiffre clé : libellé, valeur, variation, ligne secondaire, icône | Classe `stat-hero` pour la tuile principale |
| `GainLossValue` | Pourcentage de variation coloré, avec flèche haut / bas / plat | `null` affiche « — ». La flèche rend l'information lisible sans la couleur (daltonisme). |
| `SignedMoney` | Montant de plus-value avec signe explicite (+ / −) et couleur | Le montant est affiché tel quel dans la devise passée : aucune conversion. |
| `EntityAvatar` | Logo d'un actif ou d'une plateforme, avec monogramme de repli | Retombe sur les initiales si l'URL est vide, refusée par `safeImageUrl()` ou si l'image ne charge pas. Pour un actif, passer `toneClassName={ASSET_TYPE_AVATAR_TONE[type]}`. |
| `MiniSparkline` | Courbe 7 jours de 64 × 24 px dans le tableau du portefeuille | Verte si le dernier point est au moins égal au premier, rouge sinon. Moins de 2 points : « — ». Moins de 2 jours couverts : icône d'historique avec une infobulle, plutôt qu'une fausse tendance. |
| `PriceHistoryChart` | Graphique 7 jours de la page d'un actif | État « historique en construction » si les données couvrent moins de 2 jours (`isHistorySparse`). |
| `SegmentedControl` | Choix exclusif côte à côte (ex. périodes 7 j / 30 j / 90 j / 1 an) | Sémantique de bouton radio : un seul arrêt de tabulation, flèches pour changer. |
| `LogoPicker` | Choix, aperçu et retrait d'un logo dans les formulaires du catalogue | Voir [catalogue](features/catalog.md#logos). |
| `PasswordInput` | Champ mot de passe avec bouton afficher / masquer | |
| `OfflineBanner` | Bandeau rouge en haut quand l'API ne répond plus | Piloté par `lib/offline-status.ts`, voir [architecture](architecture.md#états-vides-derreur-et-hors-ligne). |
| `ErrorBoundary` | Un par route : une page qui plante n'empêche pas de naviguer ailleurs | Les détails techniques ne s'affichent qu'en dev. |

`components/ui/` contient les primitives shadcn/ui (générées, style `base-nova`, base `@base-ui/react`). On peut y ajuster le style, mais pas y mettre de logique métier.

## Formatage

| Fonction | Fichier | Usage |
| --- | --- | --- |
| `useCurrency().format(usd)` | `providers/CurrencyProvider.tsx` | Montant **instantané en USD** converti dans la devise du compte |
| `formatMoney(montant, devise)` | `lib/currency.ts` | Montant **déjà dans la bonne devise** (plus-values, aperçu d'alerte IA) |
| `formatUnitPrice` | `lib/currency.ts` | Prix unitaire : sous 1, garde 6 chiffres significatifs au lieu d'arrondir au centime (0,4299 € et non 0,43 €) |
| `formatUsd`, `formatPercent`, `formatQuantity` | `lib/format.ts` | Valeur USD de référence, pourcentages, quantités |
| `ASSET_TYPE_LABELS`, `ALERT_TYPE_LABELS`, `ALERT_WINDOW_LABELS` | `lib/format.ts` | Libellés français des énumérations de l'API |

Le choix entre `format` et `formatMoney` découle de la [règle des devises](architecture.md#règle-des-devises). Tout est formaté en `fr-FR`, avec une espace insécable visible comme séparateur de milliers.

## Accessibilité

- Les variations et plus-values ne reposent jamais sur la couleur seule (flèches, signes).
- Les animations (compteur animé de `useAnimatedNumber`, contour IA) respectent `prefers-reduced-motion`.
- Les deux navigations portent `aria-label="Navigation principale"` ; en mode icônes seules, chaque lien garde son libellé pour les lecteurs d'écran.
- Les boutons qui ne contiennent qu'une icône ont un `aria-label` (thème, menu du compte, actions d'une ligne).
