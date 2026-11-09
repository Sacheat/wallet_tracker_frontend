# Déploiement

Le front et l'API Laravel sont hébergés sur **le même serveur virtuel (VPS) mis à disposition par l'école**, derrière un seul NGINX et sous un seul nom de domaine. Les emails (vérification, mot de passe oublié, alertes, résumés) sont envoyés par le backend via **Brevo** : le front n'a rien à configurer pour eux.

La configuration NGINX n'est pas versionnée dans ce dépôt. Cette page décrit ce qu'elle doit faire.

## Vue d'ensemble

```
Navigateur ──► https://<domaine>/            NGINX sert dist/ (SPA)
           └─► https://<domaine>/backend/*   NGINX retire /backend et transmet à Laravel
```

Le front n'appelle jamais l'API directement : toutes les requêtes partent vers `/backend/...` (`API_BASE_URL` dans `src/lib/http-client.ts`), sur l'origine du front. Le navigateur ne voit donc qu'une seule origine, et le cookie de session Sanctum reste first-party.

En dev, `vite.config.ts` reproduit exactement le même comportement : `/backend/*` est proxifié vers `http://localhost:8000/*`. Le code du front est identique en dev et en prod, et le front n'utilise aucune variable `VITE_*`.

## Build

```bash
npm ci
npm run build      # tsc -b puis vite build → dist/
```

`dist/` contient `index.html` et un dossier `assets/` aux noms hashés. C'est tout ce qu'il faut copier sur le serveur.

Prérequis : Node.js 20.19+ ou 22.12+ (exigence de Vite 8).

## Ce que NGINX doit faire

| Chemin | Comportement attendu |
| --- | --- |
| `/backend/*` | Proxy vers Laravel, **préfixe `/backend` retiré** : `/backend/api/portfolio` arrive sur Laravel en `/api/portfolio`. Transmettre `Host`, `X-Forwarded-For` et `X-Forwarded-Proto`. |
| `/assets/*` | Fichiers de `dist/assets/`, avec `Cache-Control: public, max-age=31536000, immutable` (noms hashés par Vite, ils ne changent jamais). |
| Tout le reste | Fichier de `dist/` s'il existe, sinon **`index.html`** (fallback SPA : React Router gère `/allocation`, `/assets/12`, etc.). `index.html` en `Cache-Control: no-cache`, pour qu'un nouveau déploiement soit pris en compte immédiatement. |

À titre indicatif, le cœur de la configuration ressemble à ceci :

```nginx
location /backend/ {
    proxy_pass http://127.0.0.1:8000/;   # le "/" final retire le préfixe /backend
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}

location /assets/ {
    add_header Cache-Control "public, max-age=31536000, immutable";
    try_files $uri =404;
}

location / {
    add_header Cache-Control "no-cache";
    try_files $uri /index.html;
}
```

L'amont (`127.0.0.1:8000` ici) dépend de la façon dont Laravel tourne sur le VPS (php-fpm, `artisan serve`, conteneur…).

### En-têtes de sécurité

Ils étaient envoyés par `vercel.json` avant la migration. NGINX doit maintenant les ajouter sur toutes les réponses du front :

| En-tête | Valeur |
| --- | --- |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains` |
| `Content-Security-Policy` | `frame-ancestors 'none'` (voir plus bas) |
| `X-Frame-Options` | `DENY` |
| `X-Content-Type-Options` | `nosniff` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(), payment=(), usb=()` |
| `Cross-Origin-Opener-Policy` | `same-origin` |

Attention à une particularité de NGINX : un `add_header` placé dans un bloc `location` **remplace** tous ceux hérités du bloc `server`. Les en-têtes de sécurité doivent donc être répétés (ou inclus via un fichier commun) dans chaque `location` qui ajoute son propre `Cache-Control`.

### Content-Security-Policy

La CSP est en deux morceaux :

1. **Une balise `<meta>` injectée au build** par le plugin `contentSecurityPolicy()` de `vite.config.ts` :
   - `default-src 'self'`, `connect-src 'self'` (l'API est sur la même origine) ;
   - `script-src 'self' 'sha256-…'` : le hash du script inline de thème est **calculé à partir du HTML final**, donc modifier ce script ne casse jamais la page ;
   - `style-src 'self' 'unsafe-inline'`, nécessaire parce que sonner injecte une balise `<style>` ;
   - `img-src 'self' data: blob: https:` ;
   - `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`.
2. **`frame-ancestors 'none'` en en-tête HTTP**, envoyé par NGINX : cette directive est ignorée dans une balise `<meta>`.

Le plugin n'agit qu'en build : en dev, il n'y a pas de CSP.

## Côté backend

Le backend doit être configuré pour être servi derrière ce proxy, sur le domaine du front :

| Réglage Laravel | Valeur |
| --- | --- |
| `FRONTEND_URL` | URL publique du front. Sert aux redirections après vérification d'email (`/?verified=1`) et aux liens de réinitialisation du mot de passe. |
| `SANCTUM_STATEFUL_DOMAINS` | Le domaine du front, sinon Sanctum traite les requêtes comme des appels d'API sans session. |
| `SESSION_DOMAIN`, `SESSION_SECURE_COOKIE` | Le domaine du front, cookie `Secure` en HTTPS. |
| Proxies de confiance | NGINX, pour que Laravel lise `X-Forwarded-Proto` et sache que la requête est en HTTPS. |

Il n'y a plus de secret de proxy (`x-proxy-secret`) : il servait à vérifier que les appels passaient par Vercel, ce qui n'a plus lieu d'être quand NGINX et Laravel tournent sur la même machine.

## Avant une mise en production

- [ ] `npm run build` passe (types et build).
- [ ] Renseigner `PUBLICATION_MANAGER` dans `src/features/legal/constants.ts` (encore `[Prénom Nom]`).
- [ ] Remplacer les placeholders d'hébergement dans les pages légales : `[nom de l'école]`, `[raison sociale de l'hébergeur]`, forme juridique, RCS, adresse et pays dans `LegalNoticePage.tsx` ; `[Hébergeur]`, `[pays]` et `[nom de l'école]` dans `PrivacyPolicyPage.tsx`. Voir [pages légales](features/legal.md).
- [ ] Vérifier les en-têtes de sécurité et le fallback SPA sur le serveur (recharger directement une URL comme `/allocation` ne doit pas renvoyer de 404).
- [ ] Vérifier la connexion de bout en bout : login, puis rechargement de la page (la session doit survivre, sinon revoir `SANCTUM_STATEFUL_DOMAINS` et `SESSION_DOMAIN`).
