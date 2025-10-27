# Admin Dashboard

Interface d'administration pour gérer votre serveur de streaming.

## Installation

```bash
cd admin
npm install
```

## Configuration

Créez un fichier `.env` basé sur `.env.example` :

```bash
VITE_API_URL=http://localhost:3002
```

Pour production, utilisez l'URL de votre API Railway.

## Développement

```bash
npm run dev
```

L'interface sera disponible sur `http://localhost:5173`

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
