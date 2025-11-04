# Guide de Déploiement - CargoWatch sur Supabase et Vercel

Ce guide vous explique comment déployer votre application CargoWatch sur Supabase (base de données) et Vercel (hébergement).

## 📋 Table des matières

1. [Configuration Supabase](#1-configuration-supabase)
2. [Déploiement sur Vercel](#2-déploiement-sur-vercel)
3. [Configuration des variables d'environnement](#3-configuration-des-variables-denvironnement)
4. [Post-déploiement](#4-post-déploiement)
5. [Dépannage](#5-dépannage)

---

## 1. Configuration Supabase

### Étape 1.1 : Créer un projet Supabase

1. Allez sur [https://supabase.com](https://supabase.com)
2. Créez un compte ou connectez-vous
3. Cliquez sur **"New Project"**
4. Remplissez les informations :
   - **Name** : `cargowatch` (ou votre nom préféré)
   - **Database Password** : Choisissez un mot de passe fort (⚠️ **SAUVEGARDEZ-LE**)
   - **Region** : Choisissez la région la plus proche de vos utilisateurs
5. Cliquez sur **"Create new project"**
6. Attendez que le projet soit créé (2-3 minutes)

### Étape 1.2 : Récupérer les identifiants Supabase

1. Dans votre tableau de bord Supabase, allez dans **Settings** → **API**
2. Vous trouverez :
   - **Project URL** : C'est votre `SUPABASE_URL`
   - **anon public key** : C'est votre `SUPABASE_ANON_KEY`
3. **Copiez ces valeurs** - vous en aurez besoin plus tard

### Étape 1.3 : Créer le schéma de base de données

1. Dans le tableau de bord Supabase, allez dans **SQL Editor**
2. Cliquez sur **"New query"**
3. Ouvrez le fichier `supabase-schema.sql` de votre projet
4. **Copiez tout le contenu** du fichier SQL
5. **Collez-le** dans l'éditeur SQL de Supabase
6. Cliquez sur **"Run"** (ou appuyez sur `Ctrl+Enter`)
7. Vérifiez qu'il n'y a pas d'erreurs dans les résultats

✅ Cela créera :
- La table `users`
- La table `shipments`
- La table `chats`
- Les index pour de meilleures performances
- Les triggers pour les timestamps automatiques

### Étape 1.4 : Configurer Row Level Security (RLS)

Pour le développement, vous pouvez temporairement désactiver RLS :

1. Allez dans **Authentication** → **Policies**
2. Pour chaque table (`users`, `shipments`, `chats`) :
   - Cliquez sur la table
   - Si RLS est activé, vous pouvez le désactiver temporairement pour les tests

⚠️ **Important** : Pour la production, créez des politiques RLS appropriées pour sécuriser vos données.

---

## 2. Déploiement sur Vercel

### Étape 2.1 : Préparer le projet

Assurez-vous que votre projet est prêt :

1. **Vérifiez que tous les fichiers sont commités** :
   ```bash
   git status
   ```

2. **Poussez vers GitHub** (si ce n'est pas déjà fait) :
   ```bash
   git add .
   git commit -m "Prepare for Vercel deployment"
   git push origin master
   ```

### Étape 2.2 : Créer un compte Vercel

1. Allez sur [https://vercel.com](https://vercel.com)
2. Cliquez sur **"Sign Up"**
3. Choisissez **"Continue with GitHub"** (recommandé)
4. Autorisez Vercel à accéder à vos repositories GitHub

### Étape 2.3 : Importer le projet

1. Dans le tableau de bord Vercel, cliquez sur **"Add New..."** → **"Project"**
2. Sélectionnez votre repository GitHub : `DominiqueOthniel/cargowatch`
3. Cliquez sur **"Import"**

### Étape 2.4 : Configurer le projet

Vercel détectera automatiquement votre projet Node.js. Vérifiez les paramètres :

- **Framework Preset** : Other (ou laissez par défaut)
- **Root Directory** : `./` (racine du projet)
- **Build Command** : (laissez vide ou `npm run build:css`)
- **Output Directory** : (laissez vide)
- **Install Command** : `npm install`

### Étape 2.5 : Configurer les variables d'environnement

⚠️ **IMPORTANT** : Ne configurez pas encore les variables d'environnement ici. Nous le ferons après le premier déploiement.

Cliquez sur **"Deploy"** pour le premier déploiement.

---

## 3. Configuration des variables d'environnement

### Étape 3.1 : Ajouter les variables dans Vercel

1. Une fois le déploiement terminé, allez dans votre projet Vercel
2. Cliquez sur **Settings** → **Environment Variables**
3. Ajoutez les variables suivantes :

| Nom de la variable | Valeur | Environnements |
|-------------------|--------|----------------|
| `SUPABASE_URL` | Votre Project URL de Supabase | Production, Preview, Development |
| `SUPABASE_ANON_KEY` | Votre anon key de Supabase | Production, Preview, Development |
| `SESSION_SECRET` | Une chaîne aléatoire (ex: générée avec `openssl rand -base64 32`) | Production, Preview, Development |
| `PORT` | `3000` (ou laissez Vercel gérer) | Production, Preview, Development |
| `USE_SUPABASE` | `true` | Production, Preview, Development |
| `NODE_ENV` | `production` | Production |

### Étape 3.2 : Redéployer avec les variables

1. Après avoir ajouté toutes les variables, allez dans **Deployments**
2. Cliquez sur les **trois points** (⋯) du dernier déploiement
3. Sélectionnez **"Redeploy"**
4. Vérifiez que toutes les variables sont bien sélectionnées
5. Cliquez sur **"Redeploy"**

---

## 4. Post-déploiement

### Étape 4.1 : Vérifier le déploiement

1. Une fois le redéploiement terminé, cliquez sur **"Visit"** pour voir votre application
2. Testez les fonctionnalités principales :
   - Création d'un compte utilisateur
   - Création d'un envoi
   - Suivi d'un envoi
   - Interface admin

### Étape 4.2 : Vérifier la connexion Supabase

1. Créez un envoi de test dans votre application déployée
2. Allez dans votre tableau de bord Supabase
3. Vérifiez dans **Table Editor** → **shipments** que l'envoi apparaît bien

### Étape 4.3 : Configurer un domaine personnalisé (optionnel)

1. Dans Vercel, allez dans **Settings** → **Domains**
2. Ajoutez votre domaine personnalisé
3. Suivez les instructions pour configurer les DNS

---

## 5. Dépannage

### Problème : "Supabase credentials not found"

**Solution** :
- Vérifiez que toutes les variables d'environnement sont bien configurées dans Vercel
- Assurez-vous que `USE_SUPABASE=true` est défini
- Redéployez l'application après avoir ajouté les variables

### Problème : "relation does not exist"

**Solution** :
- Vérifiez que vous avez bien exécuté le script SQL dans Supabase SQL Editor
- Vérifiez que toutes les tables ont été créées dans **Table Editor**

### Problème : "permission denied" dans Supabase

**Solution** :
- Vérifiez les politiques RLS dans Supabase
- Pour le développement, vous pouvez temporairement désactiver RLS
- Pour la production, créez des politiques appropriées

### Problème : L'application ne démarre pas sur Vercel

**Solution** :
- Vérifiez les logs de déploiement dans Vercel
- Assurez-vous que `server.js` est bien le point d'entrée
- Vérifiez que toutes les dépendances sont dans `package.json`

### Problème : Les fichiers statiques ne se chargent pas

**Solution** :
- Vérifiez que le dossier `public` est bien configuré dans `server.js`
- Assurez-vous que les routes statiques sont correctement configurées

### Problème : Socket.io ne fonctionne pas sur Vercel

**Solution** :
⚠️ **Important** : Vercel Serverless Functions ont des limitations avec WebSockets/Socket.io.

**Options** :
1. **Utiliser Vercel Pro** : Les fonctions serverless peuvent gérer WebSockets avec certaines limitations
2. **Utiliser un service externe** : Configurez Socket.io avec Redis adapter pour un déploiement multi-instances
3. **Désactiver Socket.io temporairement** : Pour les fonctionnalités de chat en temps réel, vous pouvez utiliser des polling ou un service tiers

**Configuration Socket.io avec Redis (recommandé pour production)** :
```javascript
// Installer: npm install @socket.io/redis-adapter redis
const { createAdapter } = require('@socket.io/redis-adapter');
const { createClient } = require('redis');

const pubClient = createClient({ url: 'redis://...' });
const subClient = pubClient.duplicate();

io.adapter(createAdapter(pubClient, subClient));
```

### Problème : Les sessions ne persistent pas

**Solution** :
- Vercel utilise plusieurs instances, donc les sessions en mémoire ne fonctionnent pas
- Utilisez un store de sessions compatible (Redis, MongoDB, PostgreSQL) :
```javascript
// Exemple avec connect-redis
const RedisStore = require('connect-redis')(session);
const redisClient = require('redis').createClient(process.env.REDIS_URL);

app.use(session({
  store: new RedisStore({ client: redisClient }),
  secret: process.env.SESSION_SECRET,
  // ...
}));
```

### Problème : Erreur de build sur Vercel

**Solution** :
- Vérifiez que `node_modules` est dans `.gitignore`
- Assurez-vous que `package.json` contient toutes les dépendances
- Vérifiez les logs de build pour plus de détails

---

## 📝 Checklist de déploiement

Avant de déployer, assurez-vous d'avoir :

- [ ] Créé un projet Supabase
- [ ] Exécuté le script SQL `supabase-schema.sql`
- [ ] Récupéré `SUPABASE_URL` et `SUPABASE_ANON_KEY`
- [ ] Configuré un compte Vercel
- [ ] Connecté votre repository GitHub à Vercel
- [ ] Ajouté toutes les variables d'environnement dans Vercel
- [ ] Redéployé l'application avec les variables
- [ ] Testé l'application déployée
- [ ] Vérifié que les données sont bien sauvegardées dans Supabase
- [ ] Configuré les politiques RLS dans Supabase (pour la production)
- [ ] Testé les fonctionnalités critiques (création, suivi, admin)

## ⚠️ Considérations importantes pour Vercel

### Limitations de Vercel Serverless

1. **WebSockets/Socket.io** :
   - Les fonctions serverless de Vercel ont des limitations avec WebSockets
   - Pour le chat en temps réel, considérez :
     - Utiliser un service externe (Pusher, Ably, etc.)
     - Configurer Socket.io avec Redis adapter
     - Utiliser Vercel Pro pour un meilleur support

2. **Sessions** :
   - Les sessions en mémoire ne fonctionnent pas avec plusieurs instances
   - Utilisez un store de sessions (Redis, PostgreSQL via Supabase, etc.)

3. **Fichiers uploadés** :
   - Les fichiers uploadés ne persistent pas entre les déploiements
   - Utilisez Supabase Storage ou un service cloud (S3, Cloudinary, etc.)

4. **Timeouts** :
   - Les fonctions serverless ont un timeout (10s pour Hobby, 60s pour Pro)
   - Optimisez les opérations longues ou utilisez des workers

### Recommandations pour la production

1. **Base de données** : ✅ Utilisez Supabase (déjà configuré)
2. **Sessions** : Utilisez Supabase pour stocker les sessions ou Redis
3. **Stockage de fichiers** : Utilisez Supabase Storage
4. **Chat en temps réel** : Utilisez un service externe ou configurez Redis
5. **Monitoring** : Configurez les logs Vercel et Supabase

---

## 🔗 Liens utiles

- [Documentation Supabase](https://supabase.com/docs)
- [Documentation Vercel](https://vercel.com/docs)
- [Guide Supabase Setup](SUPABASE_SETUP.md)
- [GitHub Repository](https://github.com/DominiqueOthniel/cargowatch)

---

## 💡 Conseils supplémentaires

### Pour le développement local

Créez un fichier `.env` à la racine du projet :

```env
SUPABASE_URL=https://votre-projet-id.supabase.co
SUPABASE_ANON_KEY=votre-anon-key
SESSION_SECRET=votre-secret-local
PORT=3000
USE_SUPABASE=true
```

⚠️ **Ne commitez JAMAIS le fichier `.env`** - il est déjà dans `.gitignore`

### Pour les mises à jour futures

1. Faites vos modifications localement
2. Testez avec `npm start`
3. Commitez et poussez vers GitHub :
   ```bash
   git add .
   git commit -m "Description des changements"
   git push origin master
   ```
4. Vercel déploiera automatiquement les changements

### Pour les backups Supabase

1. Dans Supabase, allez dans **Settings** → **Database**
2. Vous pouvez configurer des backups automatiques
3. Pour les backups manuels, utilisez l'outil de dump PostgreSQL

---

**Bon déploiement ! 🚀**

