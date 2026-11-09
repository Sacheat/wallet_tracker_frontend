# Alertes et notifications

Dossier : `src/features/alerts/`. Écran : `/alerts` (`AlertsPage`).

## Types d'alerte

| Type | Champs | Déclenchement |
| --- | --- | --- |
| `price_above` / `price_below` | `asset_id`, `threshold` | Le cours passe au-dessus ou en dessous du seuil |
| `percent_change` | `asset_id`, `percent_threshold` (≤ 1000), `window` (`1h`/`24h`/`7d`) | Variation sur la fenêtre choisie |
| `portfolio_total_above` / `portfolio_total_below` | `threshold` | La valeur totale du portefeuille franchit le seuil |
| `allocation_drift` | `percent_threshold` uniquement | Un type d'actif s'écarte de son objectif d'au moins N points |

Après création, `type` et `asset_id` ne sont plus modifiables. L'édition (`EditAlertDialog`) porte sur le seuil, la fenêtre et l'activation (`is_active`).

## Seuils et devises

- Les seuils monétaires sont **saisis dans la devise du compte**. Le libellé du champ indique la devise, et le nombre est envoyé tel quel : c'est le backend qui le convertit en USD, **au taux du jour de l'enregistrement**, puis le stocke et le compare en USD.
- Conséquence : réaffiché plus tard avec le taux du jour, un seuil peut légèrement différer de ce qui a été saisi.
- L'API **renvoie toujours `threshold` en USD**, sous forme de chaîne. La liste le reconvertit pour l'affichage, et l'édition le reconvertit pour préremplir le champ.
- Pour un compte qui n'est pas en USD, la création ou la modification peut échouer en 503 si le taux est indisponible. `getAlertErrorMessage()` affiche alors un message invitant à réessayer.

## Création — `CreateAlertDialog`

Deux onglets, **le langage naturel en premier** :

### 1. Langage naturel — `ParseAlertForm`

1. L'utilisateur écrit par exemple « préviens-moi si le bitcoin dépasse 100000 ».
2. `POST /api/price-alerts/parse` renvoie un **aperçu** (type, actif, seuil, fenêtre). Cet appel ne crée rien.
3. L'utilisateur confirme, et les champs de l'aperçu sont envoyés à `POST /api/price-alerts`, comme pour une saisie manuelle.

Dans l'aperçu, le seuil est déjà dans la devise du compte (pas encore converti) et c'est un vrai nombre. Il est formaté avec `formatMoney` et non avec `useCurrency().format`, qui attend un montant en USD.

- **422** : demande ambiguë ou actif absent du catalogue. Le message du backend l'explique et il est affiché tel quel.
- **503** : l'IA (offre gratuite) est indisponible. L'utilisateur est renvoyé vers l'onglet manuel.

### 2. Formulaire manuel

- Le choix du type affiche les champs correspondants (actif, seuil, pourcentage, fenêtre).
- `allocation_drift` n'apparaît que si des objectifs de répartition existent. Si les objectifs ont été effacés entretemps (dans un autre onglet, par exemple), le 422 `errors.type` affiche un message qui renvoie vers `/allocation`.

## Liste — `AlertsPage`

- Interrupteur actif / inactif, édition et suppression.
- Une alerte `allocation_drift` sans objectifs est signalée comme ne pouvant plus se déclencher.
- L'historique des déclenchements est consultable dans l'[audit](audit.md) : les mises à jour de `condition_met` et `last_triggered_at` faites par le planificateur y sont journalisées.

## Notifications — `NotificationSettingsCard`

`GET` / `PATCH /api/notification-settings` :

- notifications par email ;
- webhook Discord. L'URL est un secret (quiconque la possède peut poster dans le salon) : elle est masquée par défaut, avec un bouton pour l'afficher ;
- résumé quotidien et résumé hebdomadaire (le backend y ajoute un paragraphe rédigé par IA, sans impact sur le front).

Les envois sont mis en file d'attente côté backend : un 200 signifie « en file », pas « délivré ».
