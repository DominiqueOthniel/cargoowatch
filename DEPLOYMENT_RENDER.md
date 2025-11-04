# Guide de Déploiement - CargoWatch sur Render

Ce guide vous explique comment déployer votre application CargoWatch sur Render.

## 📋 Prérequis

- ✅ Un compte GitHub avec votre projet CargoWatch
- ✅ Un projet Supabase configuré
- ✅ Les tables Supabase créées (voir `supabase-schema-complete.sql`)
- ✅ Un compte Render (gratuit disponible)

## 🚀 Étape 1 : Préparer le projet

Assurez-vous que votre projet est prêt :

1. **Vérifiez que tous les fichiers sont commités** :
   ```bash
   git status
   ```

2. **Poussez vers GitHub** (si ce n'est pas déjà fait) :
   ```bash
   git add .
   git commit -m "Prepare for Render deployment"
   git push origin master
   ```

## 🚀 Étape 2 : Créer un compte Render

1. Allez sur [render.com](https://render.com)
2. Cliquez sur **"Get Started"** ou **"Sign Up"**
3. Choisissez **"Sign up with GitHub"** (recommandé)
4. Autorisez Render à accéder à vos repositories GitHub

## 🚀 Étape 3 : Créer un nouveau service Web

1. Dans le dashboard Render, cliquez sur **"New +"**
2. Sélectionnez **"Web Service"**
3. Cliquez sur **"Connect account"** si nécessaire
4. Sélectionnez votre repository : `DominiqueOthniel/cargowatch`

## 🚀 Étape 4 : Configurer le service

Configurez les paramètres suivants :

### Informations de base
- **Name** : `cargowatch` (ou votre nom préféré)
- **Region** : Choisissez la région la plus proche de vos utilisateurs
- **Branch** : `master` (ou votre branche principale)
- **Root Directory** : `.` (laisser vide ou mettre `.`)

### Build & Deploy
- **Runtime** : `Node`
- **Build Command** : `npm install && npm run build:css`
- **Start Command** : `npm start`

### Plan
- **Plan** : `Free` (pour commencer, vous pouvez upgrader plus tard)

### Advanced Settings (optionnel)
- **Health Check Path** : `/` ou `/api` (pour vérifier que l'app fonctionne)

## 🚀 Étape 5 : Configurer les variables d'environnement

⚠️ **IMPORTANT** : Configurez ces variables AVANT le premier déploiement.

Dans la section **"Environment Variables"** du service, ajoutez :

| Variable | Valeur | Description |
|----------|--------|-------------|
| `NODE_ENV` | `production` | Environnement de production |
| `SUPABASE_URL` | `https://msdgzzjvkcsvdmqkgrxa.supabase.co` | URL de votre projet Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | Clé service role de Supabase |
| `USE_SUPABASE` | `true` | Activer Supabase |
| `SESSION_SECRET` | `u1OYQiOCy4zQsoPkJ1Y5tmitXoHxSQtHWIRirEQ0bxY=` | Secret pour les sessions |
| `PORT` | (laissez vide) | Render définit automatiquement le PORT |

### Comment ajouter les variables

1. Dans votre service Render, allez dans **"Environment"**
2. Cliquez sur **"Add Environment Variable"**
3. Ajoutez chaque variable une par une
4. Cliquez sur **"Save Changes"**

⚠️ **Sécurité** : Ne partagez jamais vos clés Supabase ou secrets !

## 🚀 Étape 6 : Déployer

1. Une fois les variables d'environnement configurées, cliquez sur **"Create Web Service"**
2. Render va :
   - Cloner votre repository
   - Installer les dépendances (`npm install`)
   - Compiler le CSS (`npm run build:css`)
   - Démarrer le serveur (`npm start`)
3. Attendez que le déploiement se termine (2-5 minutes)

## ✅ Étape 7 : Vérifier le déploiement

1. Une fois le déploiement terminé, vous verrez une URL comme : `https://cargowatch.onrender.com`
2. Cliquez sur l'URL pour tester votre application
3. Vérifiez les logs dans **"Logs"** pour voir si tout fonctionne

### Vérifier les logs

Dans Render Dashboard > votre service > **"Logs"**, vous devriez voir :
```
✅ Using Supabase database
🚀 CargoWatch Server running on http://localhost:XXXX
```

Si vous voyez `📄 Using JSON file storage`, vérifiez que :
- `USE_SUPABASE=true` est défini
- `SUPABASE_URL` et `SUPABASE_SERVICE_ROLE_KEY` sont corrects

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

### Problème : "Supabase credentials not found"

**Solution** :
- Vérifiez que `SUPABASE_URL` et `SUPABASE_SERVICE_ROLE_KEY` sont bien configurées
- Redéployez après avoir ajouté les variables

### Problème : Erreur de connexion à Supabase

**Solution** :
- Vérifiez que les tables existent dans Supabase
- Vérifiez que les politiques RLS permettent l'accès
- Testez la connexion avec la Service Role Key

### Problème : L'application se met en sleep

**Solution** :
- C'est normal avec le plan gratuit après 15 minutes d'inactivité
- La première requête après le sleep peut prendre 30-60 secondes
- Utilisez un service de monitoring pour ping l'application régulièrement

## 🔗 URLs utiles

- [Render Dashboard](https://dashboard.render.com)
- [Documentation Render](https://render.com/docs)
- [Guide Supabase](CONFIGURATION_SUPABASE.md)
- [Votre projet Supabase](https://app.supabase.com/project/msdgzzjvkcsvdmqkgrxa)

## 📋 Checklist de déploiement

Avant de déployer, assurez-vous d'avoir :

- [ ] Créé un compte Render
- [ ] Connecté votre repository GitHub
- [ ] Configuré toutes les variables d'environnement
- [ ] Créé les tables Supabase
- [ ] Testé l'application localement
- [ ] Commité et poussé les changements vers GitHub
- [ ] Déployé sur Render
- [ ] Testé l'application déployée
- [ ] Vérifié que Supabase fonctionne

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
- Utilisez Supabase Storage (recommandé)
- Utilisez un service cloud (S3, Cloudinary, etc.)
- Utilisez un volume persistant (plan payant)

### Pour Socket.io

Socket.io fonctionne mieux sur Render qu sur Vercel car Render supporte les WebSockets.

**Note** : Avec le plan gratuit, il peut y avoir des limitations. Pour une meilleure expérience, considérez un upgrade.

---

**Bon déploiement ! 🚀**

