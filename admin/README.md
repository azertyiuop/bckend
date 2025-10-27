# Admin Dashboard

Interface d'administration pour gérer votre serveur de streaming.

## Installation

```bash
cd admin
npm install
```

## Configuration

Créez un fichier `.env` avec l'URL de votre API Railway :

```bash
VITE_API_URL=https://your-railway-api-url.up.railway.app
```

Si vide, l'interface utilisera les routes relatives (même domaine).

## Développement

```bash
npm run dev
```

## Build

```bash
npm run build
```

Les fichiers de production seront dans le dossier `dist/`

## Fonctionnalités

- **Dashboard** : Vue d'ensemble des statistiques en temps réel
- **Users** : Gestion des utilisateurs connectés
- **Moderation** : Gestion des bans, mutes et messages
- **Analytics** : Graphiques et statistiques détaillées
- **Streams** : Historique et gestion des streams
- **Activity Logs** : Journal d'activité complet

## Connexion

Utilisez un compte admin créé via le script `create-admin.mjs` du serveur principal.
