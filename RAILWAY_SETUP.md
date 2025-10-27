# Configuration Railway

## Variables d'environnement obligatoires

Pour que ton application fonctionne correctement sur Railway, tu dois configurer cette variable d'environnement :

### DATABASE_URL

Cette variable contient l'URL de connexion à ta base PostgreSQL Railway.

**Comment la trouver :**

1. Va dans ton projet Railway
2. Clique sur ta base de données PostgreSQL
3. Onglet "Variables" ou "Connect"
4. Copie la valeur de `DATABASE_URL`

**Format :**
```
postgresql://username:password@hostname:port/database
```

**Exemple :**
```
postgresql://postgres:your_password@containers-us-west-123.railway.app:5432/railway
```

### Configuration dans Railway

1. Va dans ton service d'application (pas la base de données)
2. Onglet "Variables"
3. Ajoute une nouvelle variable :
   - **Nom :** `DATABASE_URL`
   - **Valeur :** L'URL de connexion de ta base PostgreSQL

4. Redémarre l'application

## Vérification

Une fois configuré, tu verras dans les logs :

```
✅ Connexion DB PostgreSQL établie
```

Au lieu de :

```
🔧 Aucune DATABASE_URL, utilisation de SQLite par défaut
```

## Autres variables optionnelles

- `JWT_SECRET` : Clé secrète pour les tokens JWT (recommandé en production)
- `DISCORD_BOT_TOKEN` : Token de ton bot Discord (déjà configuré)
- `DISCORD_WEBHOOK_URL` : Webhook pour les notifications (déjà configuré)
- `ADMIN_ACCESS_CODES` : Codes d'accès admin séparés par des virgules

## Structure de la base de données

Les tables sont créées automatiquement au démarrage :
- `users` : Comptes utilisateurs (temporaires et permanents)
- `connected_users` : Utilisateurs connectés en temps réel
- `chat_messages` : Historique du chat
- `banned_users` : Utilisateurs bannis
- `muted_users` : Utilisateurs en sourdine
- `streams` : Historique des streams
- `activity_logs` : Logs d'activité et modération
