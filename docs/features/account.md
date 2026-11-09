# Compte

Dossier : `src/features/account/`. Écran : `/account` (`AccountPage`). La page est composée de sections indépendantes, chacune avec son propre formulaire.

| Section | Endpoint | Points d'attention |
| --- | --- | --- |
| `AvatarSection` + `AvatarCropDialog` | `POST` / `DELETE /user/avatar` | Recadrage carré (react-easy-crop) puis envoi en JPEG. Vérification client : jpeg, png, webp ou gif (pas de svg), 2 Mo maximum, 4096 × 4096 px maximum. |
| `ProfileSection` | `PATCH /user` (`name`, `email`) | Changer d'email exige `current_password` et remet `email_verified_at` à `null`, ce qui affiche l'écran de vérification. |
| `CurrencySection` | `PATCH /user` (`{ currency }`) | USD, EUR, GBP ou CHF. Change immédiatement la devise de tous les montants. Cible du tutoriel (`data-tour="currency-selector"`). |
| `PasswordSection` | `PATCH /user/password` | Le backend **invalide la session** : le front appelle `endSession()` et demande de se reconnecter. |
| `DataExportSection` | `GET /user/export` | Export RGPD (JSON) : compte, notifications, positions, alertes, audit. Fichier nommé `mes-donnees-AAAA-MM-JJ.json`. 3 exports/min, avec compte à rebours sur 429. |
| `DangerZoneSection` | `DELETE /user` (`password`) | Suppression définitive, avec confirmation. Même nettoyage qu'un logout. |

La page permet aussi de relancer le [tutoriel](onboarding-and-ui.md) (bouton « Revoir le tutoriel »).

## Parcours

### Profil et email

- Le formulaire est construit par `buildProfileSchema(emailActuel)`. Le champ « Mot de passe actuel » n'apparaît que si l'email saisi diffère de l'email actuel, et il devient alors obligatoire.
- `current_password` n'est envoyé que dans ce cas.
- Après un changement d'email, la réponse contient `email_verified_at: null`. Elle remplace l'utilisateur en cache, et `ProtectedRoute` affiche immédiatement l'écran de vérification : il n'y a rien à rediriger à la main.
- Les erreurs 422 (`errors.email` pour une adresse déjà prise, `errors.current_password` pour un mauvais mot de passe) sont replacées sous les champs. Les autres erreurs s'affichent sous le formulaire.

### Mot de passe

- Mot de passe actuel, nouveau mot de passe (mêmes règles qu'à l'inscription : 15 à 64 caractères, voir [authentification](auth.md#mot-de-passe)) et confirmation, vérifiée côté client.
- En cas de succès, le backend a déjà tué la session : `endSession()`, toast « Mot de passe changé — reconnecte-toi. », puis redirection vers `/login`.

### Avatar

1. Choix d'un fichier (clic ou glisser-déposer). Le type, le poids et les dimensions sont vérifiés avant tout envoi.
2. Recadrage carré avec zoom (react-easy-crop).
3. L'image recadrée est redessinée sur un canvas (`lib/crop-image.ts`) puis envoyée en JPEG (`avatar.jpg`, champ `avatar`).
4. La réponse contient l'utilisateur à jour. La suppression répond 204 : `avatar_url` est alors mis à `null` directement dans le cache.

L'avatar s'affiche dans le menu du compte. Sans avatar, ce sont les initiales du nom (`lib/initials.ts`).

### Devise

Le changement passe par `useCurrency().setCurrency()` (`CurrencyProvider`), qui appelle `PATCH /user { currency }`. Le sélecteur est désactivé pendant l'enregistrement. Tous les montants changent dès que la réponse arrive, puisque l'utilisateur en cache est remplacé. Voir la [règle des devises](../architecture.md#règle-des-devises).

### Export de données

Le bouton est désactivé pendant la préparation, puis pendant le compte à rebours si le backend répond 429. Le fichier contient le profil, les préférences, le portefeuille, les alertes et l'historique.

### Suppression du compte

Confirmation dans un dialogue, avec le mot de passe. Le portefeuille et les alertes sont supprimés ; l'historique d'audit est conservé mais anonymisé (il apparaît comme « Compte supprimé » dans la vue admin de l'[historique](audit.md)). Après succès : `endSession()` et redirection vers `/login`.

## Notes d'implémentation

- `PATCH /user` accepte chaque champ séparément (`name`, `email`, `currency`, `onboarding_completed`). La devise et la fin du tutoriel ont donc leurs propres mutations, sans renvoyer le nom ni l'email.
- L'export utilise `responseType: "blob"`. En cas d'erreur, le corps arrive aussi sous forme de Blob : `exportMyData()` le reconvertit en JSON pour que `toApiError()` puisse lire le `message`.
- Après une mutation, l'utilisateur renvoyé par l'API remplace celui du cache `["auth","me"]`.
