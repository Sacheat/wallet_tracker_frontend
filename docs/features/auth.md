# Authentification

Dossier : `src/features/auth/`, avec `src/providers/AuthProvider.tsx` et `src/routes/`.

## Modèle

L'authentification passe par **Sanctum en mode SPA, avec un cookie de session**. Il n'y a pas de jeton Bearer, et rien n'est stocké dans le `localStorage`. La mécanique CSRF (cookie `XSRF-TOKEN` puis en-tête `X-XSRF-TOKEN`) est entièrement gérée par `lib/http-client.ts` : voir [Architecture](../architecture.md#couche-http--libhttp-clientts).

| Cookie | Durée |
| --- | --- |
| Session Laravel (httpOnly) | 2 h |
| `XSRF-TOKEN` | 2 h |
| `remember_web_*` (si « Se souvenir de moi ») | ~13 mois |

## Écrans

| Route | Composant | Endpoint |
| --- | --- | --- |
| `/login` | `LoginPage` | `POST /login` puis `GET /user` |
| `/register` | `RegisterPage` | `POST /register` puis `GET /user` |
| `/forgot-password` | `ForgotPasswordPage` | `POST /forgot-password` |
| `/reset-password?token=…&email=…` | `ResetPasswordPage` | `POST /reset-password` |
| (bloquant) | `VerifyEmailScreen` | `POST /email/verification-notification` |

Toutes ces pages utilisent `AuthLayout`.

## Cycle de vie de la session

1. **Au chargement**, `AuthProvider` interroge `GET /user`. Un 401 donne `user = null`, sans erreur.
2. **Login et register** : après le POST, le front refait toujours `GET /user` (`fetchCanonicalUser()`), parce que la réponse de `/register` est incomplète. `startSession()` purge ensuite le cache et y place l'utilisateur.
3. **Logout** : `POST /logout`. Un 401 ou un 419 compte comme un succès, puisque la session était déjà morte. `endSession()` purge le cache et prévient les autres onglets via `BroadcastChannel`.
4. **Expiration** : tout 401 sur une requête faite alors qu'un utilisateur est en cache déclenche `endSession()` et un toast « Ta session a expiré ».
5. **Changement de mot de passe ou suppression du compte** : le backend tue la session, et le front appelle `endSession()` lui-même avec un message adapté.

## Vérification de l'email

- Un compte non vérifié (`email_verified_at === null`) reçoit 403 sur tout `/api/*`. `ProtectedRoute` remplace alors toute l'app par `VerifyEmailScreen`.
- Le lien reçu par email passe par le backend, qui redirige vers `{FRONTEND_URL}/?verified=1`. `App.tsx` (`useHandleEmailVerifiedRedirect`) invalide alors l'utilisateur en cache et retire le paramètre de l'URL.
- Le lien s'ouvre souvent dans un nouvel onglet. L'écran de vérification propose donc un bouton « J'ai vérifié, actualiser » qui recharge l'utilisateur, ainsi qu'un renvoi de l'email et une déconnexion.
- Changer d'email (page Compte) remet `email_verified_at` à `null` : l'écran de vérification réapparaît.

## Mot de passe

- 15 à 64 caractères, sans règle de composition (recommandation NIST SP 800-63B, la même que le backend).
- Le backend refuse les mots de passe présents dans une fuite connue (HaveIBeenPwned) avec un 422 sur `errors.password`, affiché sous le champ.
- « Mot de passe oublié » renvoie toujours le même message neutre, qu'un compte existe ou non. Un 429 affiche un compte à rebours.
- Réinitialisation : le `token` et l'`email` sont lus dans l'URL puis retirés de la barre d'adresse. Un jeton invalide revient dans `errors.email`, et le message est affiché au niveau du formulaire.
