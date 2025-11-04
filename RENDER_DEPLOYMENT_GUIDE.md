# Guide de Déploiement - CargoWatch sur Render

Ce guide vous explique comment déployer votre application CargoWatch sur Render avec Supabase comme base de données.

## 📋 Table des matières

1. [Prérequis](#1-prérequis)
2. [Configuration Supabase](#2-configuration-supabase)
3. [Préparation du projet](#3-préparation-du-projet)
4. [Déploiement sur Render](#4-déploiement-sur-render)
5. [Configuration des variables d'environnement](#5-configuration-des-variables-denvironnement)
6. [Post-déploiement](#6-post-déploiement)
7. [Dépannage](#7-dépannage)

---

## 1. Prérequis

- Un compte GitHub (pour le repository)
- Un compte Supabase (pour la base de données)
- Un compte Render (gratuit disponible sur [render.com](https://render.com))

---

## 2. Configuration Supabase

### Étape 2.1 : Créer un projet Supabase

1. Allez sur [https://supabase.com](https://supabase.com)
2. Créez un compte ou connectez-vous
3. Cliquez sur **"New Project"**
4. Remplissez les informations :
   - **Name** : `cargowatch` (ou votre nom préféré)
   - **Database Password** : Choisissez un mot de passe fort (⚠️ **SAUVEGARDEZ-LE**)
   - **Region** : Choisissez la région la plus proche de vos utilisateurs
5. Cliquez sur **"Create new project"**
6. Attendez que le projet soit créé (2-3 minutes)

### Étape 2.2 : Récupérer les identifiants Supabase

1. Dans votre tableau de bord Supabase, allez dans **Settings** → **API**
2. Vous trouverez :
   - **Project URL** : C'est votre `SUPABASE_URL`
   - **anon public key** : C'est votre `SUPABASE_ANON_KEY`
3. **Copiez ces valeurs** - vous en aurez besoin plus tard

### Étape 2.3 : Créer le schéma de base de données

1. Dans le tableau de bord Supabase, allez dans **SQL Editor**
2. Cliquez sur **"New query"**
3. Ouvrez le fichier `supabase-schema-complete.sql` de votre projet
4. **Copiez tout le contenu** du fichier SQL
5. **Collez-le** dans l'éditeur SQL de Supabase
6. Cliquez sur **"Run"** (ou appuyez sur `Ctrl+Enter`)
7. Vérifiez qu'il n'y a pas d'erreurs dans les résultats

✅ Cela créera :
- La table `users` (avec support admin)
- La table `shipments`
- La table `chat_conversations`
- La table `chat_messages`
- Les index pour de meilleures performances
- Les triggers pour les timestamps automatiques
- L'utilisateur admin par défaut

### Étape 2.4 : Vérifier les tables créées

1. Dans Supabase, allez dans **Table Editor**
2. Vérifiez que les 4 tables suivantes existent :
   - `users`
   - `shipments`
   - `chat_conversations`
   - `chat_messages`

---

## 3. Préparation du projet

### Étape 3.1 : Vérifier que le projet est prêt

1. **Vérifiez que tous les fichiers sont commités** :
   ```bash
   git status
   ```

2. **Assurez-vous que le fichier `.env` est dans `.gitignore`** :
   ```bash
   # Le fichier .env doit être ignoré par git
   # Vérifiez que .gitignore contient : .env
   ```

3. **Poussez vers GitHub** (si ce n'est pas déjà fait) :
   ```bash
   git add .
   git commit -m "Prepare for Render deployment"
   git push origin main
   ```

### Étape 3.2 : Créer un fichier de configuration Render (optionnel)

Créez un fichier `render.yaml` à la racine du projet (optionnel mais recommandé) :

```yaml
services:
  - type: web
    name: cargowatch
    runtime: node
    plan: free
    buildCommand: npm install && npm run build:css
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 10000
    healthCheckPath: /api
```

⚠️ **Note** : Vous pouvez aussi configurer directement dans l'interface Render sans ce fichier.

---

## 4. Déploiement sur Render

### Étape 4.1 : Créer un compte Render

1. Allez sur [https://render.com](https://render.com)
2. Cliquez sur **"Get Started for Free"**
3. Choisissez **"Continue with GitHub"** (recommandé)
4. Autorisez Render à accéder à vos repositories GitHub

### Étape 4.2 : Créer un nouveau Web Service

1. Dans le tableau de bord Render, cliquez sur **"New +"** → **"Web Service"**
2. Connectez votre repository GitHub si ce n'est pas déjà fait :
   - Cliquez sur **"Connect account"** ou **"Configure GitHub"**
   - Autorisez Render à accéder à vos repositories
3. Sélectionnez votre repository : `your-username/cargowatch` (ou votre nom de repo)
4. Cliquez sur **"Connect"**

### Étape 4.3 : Configurer le service

Remplissez les informations suivantes :

- **Name** : `cargowatch` (ou votre nom préféré)
- **Region** : Choisissez la région la plus proche de vos utilisateurs
- **Branch** : `main` (ou `master` selon votre repository)
- **Root Directory** : ⚠️ **LAISSEZ VIDE** (ou `.` si vous devez spécifier quelque chose) - Le projet doit être à la racine du repository
- **Runtime** : `Node`
- **Build Command** : `npm install && npm run build:css`
- **Start Command** : `npm start`

### Étape 4.4 : Configurer le plan

- **Plan** : 
  - **Free** : Pour tester et développement (limitations : spin down après inactivité)
  - **Starter** ($7/mois) : Pour production (pas de spin down, meilleures performances)

Pour commencer, choisissez **Free**.

### Étape 4.5 : Configurer les variables d'environnement

⚠️ **IMPORTANT** : Ne déployez pas encore ! Configurez d'abord les variables d'environnement.

Dans la section **"Environment Variables"**, ajoutez les variables suivantes :

| Nom de la variable | Valeur | Description |
|-------------------|--------|-------------|
| `SUPABASE_URL` | Votre Project URL de Supabase | Ex: `https://xxxxx.supabase.co` |
| `SUPABASE_ANON_KEY` | Votre anon key de Supabase | Clé publique anonyme |
| `USE_SUPABASE` | `true` | Active l'utilisation de Supabase |
| `SESSION_SECRET` | Une chaîne aléatoire | Générez avec : `openssl rand -base64 32` |
| `NODE_ENV` | `production` | Environnement de production |
| `PORT` | `10000` | Port par défaut pour Render (Render définit automatiquement) |

📝 **Générer SESSION_SECRET** :
```bash
# Sur Linux/Mac
openssl rand -base64 32

# Sur Windows PowerShell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

### Étape 4.6 : Lancer le déploiement

1. Vérifiez que toutes les variables d'environnement sont bien configurées
2. Cliquez sur **"Create Web Service"**
3. Render va commencer à déployer votre application
4. Vous pouvez suivre le déploiement en temps réel dans les logs

⏱️ **Temps de déploiement** : Environ 5-10 minutes pour le premier déploiement

---

## 5. Configuration des variables d'environnement

### Étape 5.1 : Vérifier les variables après déploiement

1. Une fois le déploiement terminé, allez dans **Settings** → **Environment**
2. Vérifiez que toutes les variables sont bien présentes
3. Si vous avez oublié une variable, ajoutez-la et cliquez sur **"Save Changes"**
4. Render redéploiera automatiquement avec les nouvelles variables

### Étape 5.2 : Variables optionnelles

Vous pouvez ajouter ces variables si nécessaire :

| Variable | Valeur | Description |
|----------|--------|-------------|
| `CORS_ORIGIN` | URL de votre site | Ex: `https://cargowatch.onrender.com` |

---

## 6. Post-déploiement

### Étape 6.1 : Vérifier le déploiement

1. Une fois le déploiement terminé, votre application sera accessible à :
   - **URL Render** : `https://cargowatch.onrender.com` (ou votre nom personnalisé)
2. Cliquez sur l'URL ou sur **"Open Live URL"**
3. Testez les fonctionnalités principales :
   - Accès à la page d'accueil
   - Création d'un compte utilisateur
   - Création d'un envoi
   - Suivi d'un envoi
   - Interface admin (login avec admin/admin123)

### Étape 6.2 : Vérifier la connexion Supabase

1. Créez un envoi de test dans votre application déployée
2. Allez dans votre tableau de bord Supabase
3. Vérifiez dans **Table Editor** → **shipments** que l'envoi apparaît bien
4. Vérifiez aussi dans **Table Editor** → **users** qu'un utilisateur a été créé

### Étape 6.3 : Tester le chat en temps réel

1. Ouvrez deux onglets de votre application
2. Dans un onglet, démarrez un chat depuis la page de support
3. Dans l'autre onglet, connectez-vous en tant qu'admin
4. Vérifiez que les messages apparaissent en temps réel (Socket.io devrait fonctionner sur Render)

### Étape 6.4 : Configurer un domaine personnalisé (optionnel)

1. Dans Render, allez dans **Settings** → **Custom Domains**
2. Cliquez sur **"Add Custom Domain"**
3. Entrez votre domaine (ex: `app.votredomaine.com`)
4. Suivez les instructions pour configurer les DNS
5. Render vous donnera un enregistrement CNAME à ajouter dans votre DNS

---

## 7. Dépannage

### Problème : "Supabase credentials not found"

**Solution** :
- Vérifiez que toutes les variables d'environnement sont bien configurées dans Render
- Assurez-vous que `USE_SUPABASE=true` est défini
- Vérifiez les logs de déploiement dans Render (section **"Logs"**)
- Redéployez l'application après avoir ajouté les variables

### Problème : "relation does not exist" (table n'existe pas)

**Solution** :
- Vérifiez que vous avez bien exécuté le script SQL `supabase-schema-complete.sql` dans Supabase
- Vérifiez que toutes les 4 tables ont été créées dans **Table Editor** de Supabase
- Vérifiez que les noms de tables sont corrects (minuscules avec underscores)

### Problème : "permission denied" dans Supabase

**Solution** :
- Vérifiez les politiques RLS dans Supabase
- Pour le développement, les politiques dans le schéma permettent tout
- Pour la production, créez des politiques RLS appropriées si nécessaire

### Problème : "Could not read package.json: ENOENT" / "package.json not found"

**Solution** :
- ⚠️ **C'est le problème le plus courant** : Le Root Directory est mal configuré
- Dans Render, allez dans **Settings** → **Build & Deploy**
- Vérifiez que **"Root Directory"** est **VIDE** (ou `.` si vous devez spécifier quelque chose)
- Si vous voyez `src` ou autre chose, **effacez-le complètement**
- Sauvegardez et redéployez
- Le `package.json` doit être à la racine de votre repository GitHub

### Problème : L'application ne démarre pas

**Solution** :
- Vérifiez les logs de déploiement dans Render (section **"Logs"**)
- Assurez-vous que `server.js` est bien le point d'entrée dans `package.json`
- Vérifiez que toutes les dépendances sont dans `package.json`
- Vérifiez que le `PORT` est bien configuré (Render utilise `process.env.PORT` automatiquement)

### Problème : Socket.io ne fonctionne pas

**Solution** :
- Render supporte WebSockets/Socket.io nativement ✅
- Vérifiez que votre URL utilise HTTPS (Render le fait automatiquement)
- Vérifiez les logs pour voir si Socket.io se connecte correctement
- Assurez-vous que CORS est configuré correctement dans `server.js`

### Problème : Les sessions ne persistent pas

**Solution** :
- Sur le plan Free, Render peut redémarrer l'instance, ce qui efface les sessions en mémoire
- Pour la production, considérez utiliser un store de sessions (Redis, PostgreSQL via Supabase)
- Pour tester, cela devrait fonctionner sur une seule instance

### Problème : L'application se met en veille (Free plan)

**Solution** :
- Sur le plan Free, Render met l'application en veille après 15 minutes d'inactivité
- Le premier accès après la mise en veille peut prendre 30-60 secondes
- Pour éviter cela, passez au plan **Starter** ($7/mois)
- Ou utilisez un service de "ping" pour maintenir l'application active

### Problème : Les fichiers uploadés disparaissent

**Solution** :
- Les fichiers dans le système de fichiers ne persistent pas entre les redéploiements
- Utilisez Supabase Storage pour stocker les fichiers de manière permanente
- Ou configurez un service de stockage cloud (S3, Cloudinary, etc.)

### Problème : Erreur de build CSS

**Solution** :
- Vérifiez que la commande `build:css` fonctionne localement
- Assurez-vous que toutes les dépendances Tailwind sont installées
- Vérifiez les logs de build pour voir l'erreur exacte

---

## 📝 Checklist de déploiement

Avant de déployer, assurez-vous d'avoir :

- [ ] Créé un projet Supabase
- [ ] Exécuté le script SQL `supabase-schema-complete.sql`
- [ ] Vérifié que les 4 tables existent (users, shipments, chat_conversations, chat_messages)
- [ ] Récupéré `SUPABASE_URL` et `SUPABASE_ANON_KEY`
- [ ] Configuré un compte Render
- [ ] Connecté votre repository GitHub à Render
- [ ] Configuré toutes les variables d'environnement dans Render
- [ ] Déployé l'application
- [ ] Testé l'application déployée
- [ ] Vérifié que les données sont bien sauvegardées dans Supabase
- [ ] Testé les fonctionnalités critiques (création, suivi, admin, chat)

---

## ⚠️ Considérations importantes pour Render

### Avantages de Render vs Vercel

1. **WebSockets/Socket.io** : ✅ Support complet (pas de limitations serverless)
2. **Sessions en mémoire** : ✅ Fonctionne sur une seule instance
3. **Applications complètes** : ✅ Support complet pour Node.js/Express
4. **Déploiements continus** : ✅ Auto-déploiement depuis GitHub

### Limitations du plan Free

1. **Spin down** : L'application se met en veille après 15 min d'inactivité
2. **Temps de démarrage** : 30-60 secondes au premier accès après mise en veille
3. **Ressources limitées** : 512 MB RAM, CPU partagé
4. **Pas de SSL personnalisé** : SSL automatique fourni

### Recommandations pour la production

1. **Plan Starter** ($7/mois) : 
   - Pas de spin down
   - 512 MB RAM dédiée
   - Meilleures performances

2. **Base de données** : ✅ Utilisez Supabase (déjà configuré)

3. **Stockage de fichiers** : Utilisez Supabase Storage pour les fichiers uploadés

4. **Monitoring** : Configurez les logs Render et Supabase

5. **Backups** : Configurez les backups automatiques dans Supabase

---

## 🔗 Liens utiles

- [Documentation Supabase](https://supabase.com/docs)
- [Documentation Render](https://render.com/docs)
- [Guide Supabase Setup](SUPABASE_SETUP.md)
- [Render Dashboard](https://dashboard.render.com)

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
NODE_ENV=development
```

⚠️ **Ne commitez JAMAIS le fichier `.env`** - il est déjà dans `.gitignore`

### Pour les mises à jour futures

1. Faites vos modifications localement
2. Testez avec `npm start`
3. Commitez et poussez vers GitHub :
   ```bash
   git add .
   git commit -m "Description des changements"
   git push origin main
   ```
4. Render déploiera automatiquement les changements

### Pour maintenir l'application active (Free plan)

Vous pouvez utiliser un service de "ping" gratuit comme :
- [UptimeRobot](https://uptimerobot.com) - Ping toutes les 5 minutes
- [Cron-Job.org](https://cron-job.org) - Cron job pour ping votre site

⚠️ **Note** : Cela peut violer les termes d'utilisation du plan Free. Pour la production, utilisez le plan Starter.

### Pour les backups Supabase

1. Dans Supabase, allez dans **Settings** → **Database**
2. Configurez les backups automatiques (disponible sur les plans payants)
3. Pour les backups manuels, utilisez l'outil de dump PostgreSQL

---

## 🎯 Prochaines étapes après déploiement

1. ✅ **Tester toutes les fonctionnalités**
2. ✅ **Configurer un domaine personnalisé** (optionnel)
3. ✅ **Migrer les données existantes** (si vous avez des données JSON)
4. ✅ **Configurer les backups Supabase**
5. ✅ **Monitorer les performances** via les logs Render
6. ✅ **Optimiser les performances** (cache, CDN, etc.)

---

**Bon déploiement sur Render ! 🚀**

