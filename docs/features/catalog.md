# Catalogue : actifs, plateformes et logos

Dossiers : `src/features/catalog/` (écran), `src/features/assets/` et `src/features/platforms/` (données et formulaires), `src/lib/logo-upload.ts`, `src/components/LogoPicker.tsx`. Écran : `/catalog`, avec deux onglets, Actifs et Plateformes.

## Un catalogue partagé

Les actifs et les plateformes sont **communs à tous les utilisateurs**. Une position ou une alerte y fait référence par son id.

| Opération | Qui |
| --- | --- |
| Lire, créer | Tout le monde |
| Modifier, supprimer, changer le logo | Un admin, ou le créateur tant que personne d'autre n'utilise l'entrée |

Le front ne peut pas savoir à l'avance si une action sera autorisée. Les boutons restent donc visibles, et le `message` du backend (en français) est affiché tel quel en cas de 403. `getCatalogErrorMessage()` (`lib/catalog-errors.ts`) gère aussi :

- **409** : suppression impossible tant que l'entrée est utilisée, y compris pour un admin ;
- **429** : les créations et les routes `/logo` partagent une limite de 10 écritures/min par utilisateur.

## Actifs — `AssetFormDialog`

Champs : nom, symbole, type (`crypto`, `stock`, `etf`, `gold`) et `external_id`, l'identifiant chez le fournisseur de cours (id CoinGecko ou ticker Yahoo).

- **À la création**, une recherche (`GET /api/assets/search?q=`, avec debounce, entre 2 et 100 caractères) interroge CoinGecko et Yahoo. Choisir un résultat remplit nom, symbole, type et `external_id`. `external_id` n'a pas de saisie manuelle.
- **L'or** n'est pas indexé par la recherche : choisir le type `gold` fixe `external_id = "GC=F"`, et la valeur est retirée si on change de type.
- Un aperçu en direct montre la ligne telle qu'elle apparaîtra dans le tableau.

## Plateformes — `PlatformFormDialog`

Un nom et un logo.

## Logos

Le backend **refuse `logo_url` en écriture** (422). Les logos sont des fichiers envoyés au backend, qui les sert lui-même depuis `/storage/logos/…`. Afficher un logo ne contacte donc jamais un serveur tiers.

Le formulaire fait deux appels :

1. enregistrement de la ressource en JSON (POST ou PATCH) ;
2. selon le brouillon de logo (`LogoDraft` : `keep`, `replace` ou `remove`), `POST` ou `DELETE /api/{assets|platforms}/{id}/logo` (multipart, champ `logo`).

`applyLogoDraft()` **ne lève jamais d'erreur** : la ressource existe déjà, donc un échec du logo est renvoyé à part (`logoError`).

- **Création** : le dialogue se ferme avec un toast d'avertissement (« créé, mais sans logo »). Le resoumettre recréerait l'entrée.
- **Modification** : le dialogue reste ouvert pour réessayer le logo seul (le PATCH est idempotent).

Contraintes vérifiées côté client avant l'envoi, comme côté serveur : PNG, JPEG ou WebP (ni SVG ni GIF), 512 Ko maximum, 1024 × 1024 px maximum.

Les URL de logo sont filtrées par `safeImageUrl()`. Après une modification d'actif, `["assets"]` et `["portfolio-entries"]` sont invalidés, parce que les positions embarquent l'actif et son logo.
