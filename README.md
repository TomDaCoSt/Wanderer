# Wanderer

## Authentification Google + projets utilisateur

L'application est maintenant fermée tant que l'utilisateur n'est pas connecté.

### Variables d'environnement Vercel

Configurer ces variables dans le projet Vercel :

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URI` (ex: `https://votre-domaine.vercel.app/api/auth/google/callback`)
- `SESSION_SECRET` (clé longue et aléatoire pour signer la session)

### Configuration Google OAuth

Dans Google Cloud Console :

1. Créer un client OAuth 2.0 (type Web application).
2. Ajouter l'URI de redirection autorisée :
   - `https://votre-domaine.vercel.app/api/auth/google/callback`
3. Ajouter le domaine de l'application dans les origines autorisées.

### Endpoints

- `GET /api/auth/google/login` : démarre la connexion Google
- `GET /api/auth/google/callback` : callback OAuth Google
- `GET /api/auth/me` : retourne l'utilisateur connecté
- `GET /api/auth/logout` : déconnexion
- `GET /api/projects` : récupère l'espace projets de l'utilisateur
- `PUT /api/projects` : sauvegarde l'espace projets de l'utilisateur