# Guide de Déploiement - CargoWatch sur Render

Ce guide explique comment héberger **frontend + backend** CargoWatch sur Render.

## 🏗️ Architecture

CargoWatch est une **application monolithique** : un seul service Node.js/Express sert à la fois :
- **Backend** : API REST (`/api/*`), sessions, MongoDB
- **Frontend** : pages HTML, CSS, JS (`/pages/*`, `/`)

**Un seul déploiement Render** suffit pour tout héberger.

### En résumé

1. **1 service Web** sur Render (pas de séparation front/back)
2. **MongoDB Atlas** pour les données
3. Variables : `MONGODB_URI`, `SESSION_SECRET`, `NODE_ENV`
4. Build : `npm install && npm run build:css`
5. Start : `npm start`

## 📋 Prérequis

- Compte GitHub avec le projet
- Compte Render (gratuit)
- **Base MongoDB Atlas** (obligatoire pour la production)

## 🚀 Étape 1 : Pousser le code sur GitHub

```bash
git add .
git commit -m "Prepare for Render deployment"
git push origin master
```

Repository : https://github.com/DominiqueOthniel/cargoowatch

## 🚀 Étape 2 : Créer un Web Service sur Render

1. Allez sur [render.com](https://render.com) → **Dashboard**
2. **New +** → **Web Service**
3. Connectez votre compte GitHub si besoin
4. Sélectionnez le repo `DominiqueOthniel/cargoowatch`

## 🚀 Étape 3 : Configurer le service

| Paramètre | Valeur |
|-----------|--------|
| **Name** | `cargowatch` |
| **Region** | Frankfurt ou plus proche |
| **Branch** | `master` |
| **Root Directory** | (vide) |
| **Runtime** | `Node` |
| **Build Command** | `npm install && npm run build:css` |
| **Start Command** | `npm start` |
| **Plan** | `Free` |
| **Health Check Path** | `/api` |

## 🚀 Étape 4 : Variables d'environnement (OBLIGATOIRE)

Dans **Environment** → **Add Environment Variable** :

| Variable | Valeur | Obligatoire |
|----------|--------|-------------|
| `NODE_ENV` | `production` | ✅ |
| `SESSION_SECRET` | Chaîne aléatoire (ex: `openssl rand -base64 32`) | ✅ |
| `MONGODB_URI` | `mongodb+srv://user:pass@cluster.mongodb.net/cargowatchAc?retryWrites=true&w=majority` | ✅ |
| `MONGODB_DB_NAME` | `cargowatchAc` | Optionnel |
| `PORT` | (laisser vide) | Render définit automatiquement |

⚠️ **MongoDB Atlas** : Dans Network Access, ajoutez `0.0.0.0/0` pour autoriser Render.

### Générer SESSION_SECRET

```bash
openssl rand -base64 32
```

## 🔄 Étapes 6–7 : Déploiement automatique

Après configuration, Render va automatiquement :
- Cloner le repo
- `npm install && npm run build:css`
- `npm start`

Chaque `git push origin master` déclenche un nouveau déploiement.

## ✅ Étape 5 : Déployer et vérifier

1. Cliquez sur **"Create Web Service"**
2. Attendez le build (2–5 min)
3. URL finale : `https://cargowatch-xxxx.onrender.com`

### Logs attendus

Dans **Logs** vous devriez voir :
```
✅ MongoDB connected: cargowatchAc
📦 Using MongoDB
🚀 CargoWatch Server running on...
📡 API available at /api
💬 Chat system enabled (Socket.io)
```

### URLs utiles après déploiement

| URL | Description |
|-----|-------------|
| `https://votre-app.onrender.com/` | Page d'accueil / Tracking |
| `https://votre-app.onrender.com/pages/admin_dashboard.html` | Dashboard admin |
| `https://votre-app.onrender.com/api-docs` | Documentation Swagger |
| `https://votre-app.onrender.com/api` | Info API |

## 🔄 Mises à jour futures

Pour mettre à jour votre application :

1. Faites vos modifications localement
2. Testez avec `npm start`
3. Commitez et poussez vers GitHub :
   ```bash
   git add .
   git commit -m "Description des changements"
   git push origin master
   ```
4. Render détectera automatiquement les changements et redéploiera

## 📝 Configuration du fichier render.yaml

Le fichier `render.yaml` est déjà configuré. Vous pouvez aussi utiliser Render Dashboard pour configurer manuellement.

### Avantages du fichier render.yaml
- ✅ Configuration versionnée dans Git
- ✅ Déploiement reproductible
- ✅ Facile à partager avec l'équipe

## ⚠️ Limitations du plan gratuit

Le plan gratuit Render a quelques limitations :
- ⏱️ **Sleep après 15 minutes d'inactivité** : La première requête après le sleep peut prendre 30-60 secondes
- 📊 **Limites de ressources** : CPU et RAM limités
- 🔗 **URL personnalisée** : Format `yourapp.onrender.com`

### Solutions
- **Upgrade vers un plan payant** pour éviter le sleep
- **Utiliser un service de monitoring** (comme UptimeRobot) pour ping l'application toutes les 5 minutes
- **Configurer un domaine personnalisé** (gratuit avec le plan payant)

## 🐛 Dépannage

### Problème : Le build échoue

**Solution** :
- Vérifiez les logs de build dans Render
- Assurez-vous que `package.json` contient toutes les dépendances
- Vérifiez que `build:css` fonctionne localement

### Problème : L'application ne démarre pas

**Solution** :
- Vérifiez les logs de démarrage
- Assurez-vous que toutes les variables d'environnement sont configurées
- Vérifiez que `npm start` fonctionne localement

### Problème : Les données disparaissent après redéploiement

**Solution** : Utilisez MongoDB Atlas. Les données sont stockées dans le cloud, pas sur le disque Render.

### Problème : L'application se met en sleep

**Solution** :
- C'est normal avec le plan gratuit après 15 minutes d'inactivité
- La première requête après le sleep peut prendre 30-60 secondes
- Utilisez un service de monitoring pour ping l'application régulièrement

## 🔗 URLs utiles

- [Render Dashboard](https://dashboard.render.com)
- [Documentation Render](https://render.com/docs)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (pour migration future)

## 📋 Checklist de déploiement

Avant de déployer, assurez-vous d'avoir :

- [ ] Créé un compte Render
- [ ] Connecté votre repository GitHub
- [ ] Configuré toutes les variables d'environnement
- [ ] Testé l'application localement
- [ ] Commité et poussé les changements vers GitHub
- [ ] Déployé sur Render
- [ ] Testé l'application déployée

## 💡 Conseils supplémentaires

### Pour éviter le sleep (plan gratuit)

Créez un service de monitoring gratuit (UptimeRobot) :
1. Créez un compte sur [UptimeRobot](https://uptimerobot.com)
2. Ajoutez un monitor HTTP(s) pour votre URL Render
3. Configurez-le pour ping toutes les 5 minutes
4. Cela empêchera votre application de se mettre en sleep

### Pour les fichiers statiques

Les fichiers dans `public/` seront servis automatiquement par Express.

### Pour les uploads de fichiers

⚠️ **Important** : Sur Render, les fichiers uploadés ne persistent pas entre les redéploiements.

**Solutions** :
- Utilisez MongoDB GridFS (après migration)
- Utilisez un service cloud (S3, Cloudinary, etc.)
- Utilisez un volume persistant (plan payant)

### Pour Socket.io

Socket.io fonctionne mieux sur Render que sur Vercel car Render supporte les WebSockets.

**Note** : Avec le plan gratuit, il peut y avoir des limitations. Pour une meilleure expérience, considérez un upgrade.

### MongoDB Atlas

La base `cargowatchAc` stocke : users, shipments, chats, reviews. Les données persistent entre les redéploiements.

---

**Bon déploiement ! 🚀**
