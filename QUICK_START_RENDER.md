# 🚀 Déploiement Rapide sur Render

## Étapes rapides

### 1. Créer un compte Render
👉 [render.com](https://render.com) → Sign up with GitHub

### 2. Créer un nouveau Web Service
- Cliquez sur **"New +"** → **"Web Service"**
- Connectez votre repo GitHub : `DominiqueOthniel/cargowatch`

### 3. Configuration
- **Name** : `cargowatch`
- **Build Command** : `npm install && npm run build:css`
- **Start Command** : `npm start`
- **Plan** : `Free`

### 4. Variables d'environnement ⚠️ IMPORTANT

Ajoutez dans **Environment Variables** :

```env
NODE_ENV=production
SESSION_SECRET=u1OYQiOCy4zQsoPkJ1Y5tmitXoHxSQtHWIRirEQ0bxY=
# MongoDB (à venir)
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/cargowatch
```

### 5. Déployer
- Cliquez sur **"Create Web Service"**
- Attendez 2-5 minutes
- Votre app sera disponible sur `https://cargowatch.onrender.com`

## ✅ Vérification

Dans les logs, vous devriez voir :
```
📄 Using JSON file storage
🚀 CargoWatch Server running on http://localhost:XXXX
```

## 📚 Documentation complète

Voir `DEPLOYMENT_RENDER.md` pour plus de détails.
