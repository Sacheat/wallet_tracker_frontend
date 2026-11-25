# Pages légales

Dossier : `src/features/legal/`. Écrans : `/mentions-legales` (`LegalNoticePage`) et `/confidentialite` (`PrivacyPolicyPage`).

## Accès

Les deux pages sont **publiques, connecté ou non**. Elles sont déclarées dans `App.tsx` en dehors des deux gardes de route : `PublicOnlyRoute` renverrait un utilisateur connecté vers l'accueil, et `ProtectedRoute` bloquerait un visiteur. Elles utilisent leur propre coquille, `LegalLayout` (en-tête avec logo et sélecteur de thème, lien de retour, date de mise à jour facultative), et non `AppShell`.

On y accède par le pied de page (`Footer`), présent dans l'app, sur les pages d'authentification et sur la 404. Le formulaire d'inscription renvoie aussi vers la politique de confidentialité.

## Fichiers

| Fichier | Contenu |
| --- | --- |
| `constants.ts` | `CONTACT_EMAIL` (utilisé aussi par le pied de page), `PUBLICATION_MANAGER`, `LEGAL_ROUTES` |
| `LegalLayout.tsx` | `LegalLayout`, `LegalSection` (titre et contenu) et `LegalTable` (tableau simple, utilisé pour les cookies) |
| `LegalNoticePage.tsx` | Éditeur du site, hébergement |
| `PrivacyPolicyPage.tsx` | Politique de confidentialité, avec sa date de mise à jour (`updatedAt`) |

## Contenu de la politique de confidentialité

| Section | Ce qu'elle déclare |
| --- | --- |
| Responsable | L'éditeur et l'adresse de contact |
| Données collectées | Tableau données / utilisation / base légale : compte (nom, email, mot de passe haché, avatar, devise), positions et alertes, préférences de notification et webhook Discord, historique des actions, IP et navigateur de la session, texte des alertes en langage naturel |
| Cookies | Uniquement les cookies indispensables : `laravel-session` (2 h d'inactivité), `XSRF-TOKEN` (2 h), `remember_web_…` (13 mois, seulement avec « Se souvenir de moi »). Aucun cookie de mesure d'audience. |
| Destinataires | Hébergeur (VPS de l'école), **Brevo** (emails), **Google Gemini** (alertes en langage naturel et résumés, sans nom ni email), **Discord** (seulement si un webhook est configuré). Les fournisseurs de données de marché ne reçoivent que des identifiants d'actifs. |
| Conservation | Données du compte jusqu'à sa suppression ; audit conservé mais détaché du compte ; session 2 h ; lien de réinitialisation 60 min ; journaux d'erreurs 14 jours ; emails en échec 7 jours |
| Droits | Accès et portabilité (« Télécharger mes données », page Compte), rectification (profil), effacement (suppression du compte), opposition (désactiver emails, résumés ou webhook), réclamation auprès de la CNIL |

## Quand mettre ces pages à jour

Ces pages décrivent l'infrastructure et les sous-traitants réels. Elles doivent changer en même temps que :

- **l'hébergement** ;
- **un prestataire qui reçoit des données personnelles** : envoi d'emails, IA, notifications ;
- **un nouveau cookie** ou une nouvelle durée de session ;
- **une nouvelle donnée collectée** ou une nouvelle durée de conservation.

Penser à mettre à jour `updatedAt` dans `PrivacyPolicyPage.tsx` à chaque modification (dernière mise à jour : 9 novembre 2026, migration vers le VPS et Brevo).

## Placeholders à remplir avant la mise en production

| Fichier | Placeholder |
| --- | --- |
| `constants.ts` | `PUBLICATION_MANAGER = "[Prénom Nom]"` : le nom réel du responsable de la publication, volontairement laissé visible |
| `LegalNoticePage.tsx` | `[nom de l'école]`, `[raison sociale de l'hébergeur]`, `[forme juridique]`, `[RCS ou numéro d'entreprise]`, `[adresse du siège]`, `[pays]` |
| `PrivacyPolicyPage.tsx` | `[Hébergeur]`, `[pays]`, `[nom de l'école]` |

Une recherche de `\[` dans `src/features/legal/` permet de vérifier qu'il n'en reste aucun.
