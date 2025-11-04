# ⚡ Fix Rapide - Erreur package.json not found sur Render

## 🎯 Solution Express (2 minutes)

### Étape 1 : Ouvrir Render Dashboard
1. Allez sur [dashboard.render.com](https://dashboard.render.com)
2. Connectez-vous à votre compte
3. Cliquez sur votre service **"cargowatch"** (ou le nom de votre service)

### Étape 2 : Corriger le Root Directory
1. Dans le menu de gauche, cliquez sur **"Settings"** ⚙️
2. Faites défiler jusqu'à la section **"Build & Deploy"**
3. Trouvez le champ **"Root Directory"**
4. **ACTION CRITIQUE** :
   - Cliquez dans le champ
   - **Sélectionnez tout** (Ctrl+A)
   - **Supprimez TOUT** (Backspace)
   - **Laissez le champ COMPLÈTEMENT VIDE** (même pas un point)
5. Si le champ ne peut pas être vide, mettez juste **`.`** (un point)

### Étape 3 : Sauvegarder
1. Faites défiler jusqu'en bas
2. Cliquez sur **"Save Changes"**
3. Render redéploiera automatiquement
4. Attendez 2-5 minutes

## ✅ Vérification

Après le redéploiement, allez dans l'onglet **"Logs"** et cherchez :
```
==> Cloning from https://github.com/...
==> Detected Node.js
==> Installing dependencies
```

Si vous voyez toujours l'erreur `/opt/render/project/src/package.json`, le Root Directory n'est pas encore correct.

## 🔍 Pourquoi cette erreur ?

Render cherche `package.json` dans :
- ❌ `/opt/render/project/src/package.json` (si Root Directory = `src`)
- ✅ `/opt/render/project/package.json` (si Root Directory est vide)

Quand Root Directory est vide, Render utilise la racine de votre repository GitHub directement.

---

**Une fois corrigé, votre déploiement devrait fonctionner ! 🚀**

