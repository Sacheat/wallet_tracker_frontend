# Déploiement

Le front est hébergé sur **Vercel**, l'API Laravel sur **alwaysdata** (`https://pftracker.alwaysdata.net`).

## Pourquoi un proxy `/backend`

L'authentification Sanctum repose sur un cookie de session. Le domaine Vercel (`*.vercel.app`) et celui d'alwaysdata sont des suffixes publics différents, donc un appel direct du navigateur vers l'API serait **cross-site** : le cookie serait bloqué ou traité comme un cookie tiers.

Toutes les requêtes passent donc par le chemin `/backend/*` du front, que Vercel réécrit vers l'API (`vercel.json`) :

```json
{ "source": "/backend/:path*", "destination": "https://pftracker.alwaysdata.net/:path*" }
```

Le navigateur ne voit qu'une seule origine. En dev, `vite.config.ts` reproduit exactement le même comportement vers `http://localhost:8000`.

### Secret de proxy

Une règle `routes` de `vercel.json` ajoute l'en-tête `x-proxy-secret: $PROXY_SECRET` à chaque requête `/backend/*`. Le backend peut ainsi refuser les appels qui ne viennent pas du proxy.

**À configurer dans Vercel** (Project → Settings → Environment Variables) :

| Variable | Rôle |
| --- | --- |
| `PROXY_SECRET` | Même valeur que celle attendue par le backend |

Aucune autre variable n'est nécessaire : le front n'utilise pas de `VITE_*`.

### Côté backend

L'API doit avoir :

- `FRONTEND_URL` = l'URL publique du front (redirections de vérification d'email et de réinitialisation du mot de passe) ;
- la vérification de `x-proxy-secret` ;
- une configuration Sanctum « stateful » qui reconnaît le domaine du front.

## Réécritures et cache

| Règle | Effet |
| --- | --- |
| `/backend/*` | Proxy vers l'API |
| `/((?!backend/\|assets/).*)` → `/index.html` | Fallback SPA pour React Router |
| `/assets/*` | `Cache-Control: public, max-age=31536000, immutable` (fichiers hashés par Vite) |
| Tout le reste (dont `index.html`) | `Cache-Control: no-cache` |

## En-têtes de sécurité

Envoyés sur toutes les réponses par `vercel.json` :

- `Strict-Transport-Security: max-age=63072000; includeSubDomains`
- `Content-Security-Policy: frame-ancestors 'none'` et `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy` : caméra, micro, géolocalisation, paiement et USB désactivés
- `Cross-Origin-Opener-Policy: same-origin`

### Content-Security-Policy

Le reste de la CSP est injecté en `<meta>` **au build** par le plugin `contentSecurityPolicy()` de `vite.config.ts` :

- `default-src 'self'`, `connect-src 'self'` (l'API est same-origin grâce au proxy) ;
- `script-src 'self' 'sha256-…'` : le hash du script inline de thème est **calculé à partir du HTML final**. Le modifier ne casse donc jamais la page ;
- `style-src 'self' 'unsafe-inline'`, nécessaire parce que sonner injecte une balise `<style>` ;
- `img-src 'self' data: blob: https:` ;
- `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`.

`frame-ancestors` ne peut pas être défini dans une balise `<meta>` : c'est pour cela qu'il est envoyé en en-tête HTTP.

> Vercel Analytics et Speed Insights chargent leurs scripts depuis `/_vercel/...` (même origine). Ils sont donc compatibles avec cette CSP.

## Avant une mise en production

- [ ] Renseigner `PUBLICATION_MANAGER` dans `src/features/legal/constants.ts`. C'est encore le placeholder `[Prénom Nom]`.
- [ ] Vérifier que la politique de confidentialité décrit bien le relais des requêtes par Vercel.
- [ ] Définir `PROXY_SECRET` dans Vercel et côté backend.
- [ ] `npm run build` passe (types et build).
