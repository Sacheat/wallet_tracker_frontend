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

La page permet aussi de relancer le [tutoriel](onboarding-and-ui.md).

## Notes d'implémentation

- `PATCH /user` accepte chaque champ séparément (`name`, `email`, `currency`, `onboarding_completed`). La devise et la fin du tutoriel ont donc leurs propres mutations, sans renvoyer le nom ni l'email.
- L'export utilise `responseType: "blob"`. En cas d'erreur, le corps arrive aussi sous forme de Blob : `exportMyData()` le reconvertit en JSON pour que `toApiError()` puisse lire le `message`.
- Après une mutation, l'utilisateur renvoyé par l'API remplace celui du cache `["auth","me"]`.
