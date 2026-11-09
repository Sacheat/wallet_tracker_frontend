# Historique (audit)

Dossier : `src/features/audit/`. Écran : `/audit` (`AuditPage`, libellé « Historique » dans la navigation).

## Données

`GET /api/audit-logs?page=N&scope=mine|all`, paginé par 25.

Chaque entrée indique le type et l'id de l'objet concerné, l'action (`created`, `updated` ou `deleted`), les `changes`, la date et la `source` :

- `"web"` : action faite via l'API ;
- `"console"` : action système, par exemple le planificateur qui déclenche une alerte ;
- `null` : entrée antérieure au 28/09/2026, dont l'origine est inconnue.

Le journal sert aussi d'**historique des déclenchements d'alertes** : les mises à jour de `condition_met` et `last_triggered_at` y apparaissent.

## Vue admin

- Si `user.is_admin`, un sélecteur propose « Mes actions » ou « Tous les utilisateurs » (`scope=all`). Pour un non-admin, le backend répondrait 403 : `is_admin` ne fait qu'afficher ou masquer le choix.
- En vue globale, chaque entrée porte un `user: { id, name, avatar_url }`. La cellule « Auteur » affiche :

| Cas | Affichage |
| --- | --- |
| `user` présent | Avatar et nom, plus « automatique » si `source = "console"` (une alerte déclenchée par le planificateur est attribuée à son propriétaire) |
| Pas d'auteur, `source = "web"` | « Compte supprimé » |
| Pas d'auteur, `source = "console"` | « Système » |
| `source = null` | « Auteur inconnu », avec une infobulle |

## Cache

La clé `["audit-logs", scope, page]` inclut le scope : les deux vues ne sont jamais servies l'une pour l'autre. Pendant le chargement de la page suivante, la page précédente reste affichée, **mais seulement dans le même scope**. On ne voit donc jamais un instant ses propres actions sous le titre « Tous les utilisateurs ».

`is_admin` n'est relu qu'au rechargement de la page, parce que la requête d'auth a un `staleTime` infini.
