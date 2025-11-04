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
SUPABASE_URL=https://msdgzzjvkcsvdmqkgrxa.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1zZGd6emp2a2NzdmRtcWtncnhhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjI4MTgwOCwiZXhwIjoyMDc3ODU3ODA4fQ.iF_EnY_CSUw8v4Lv8ViVqrxfJKEmxBgrEcJ1uq3FPyo
USE_SUPABASE=true
SESSION_SECRET=u1OYQiOCy4zQsoPkJ1Y5tmitXoHxSQtHWIRirEQ0bxY=
```

### 5. Déployer
- Cliquez sur **"Create Web Service"**
- Attendez 2-5 minutes
- Votre app sera disponible sur `https://cargowatch.onrender.com`

## ✅ Vérification

Dans les logs, vous devriez voir :
```
✅ Using Supabase database
🚀 CargoWatch Server running on http://localhost:XXXX
```

## 📚 Documentation complète

Voir `DEPLOYMENT_RENDER.md` pour plus de détails.

