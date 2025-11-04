# 🔧 Fix Urgent : Erreur "package.json not found" sur Render

## ❌ Erreur
```
npm error path /opt/render/project/src/package.json
npm error errno -2
npm error enoent Could not read package.json
```

## ✅ Solution en 3 étapes

### Étape 1 : Accéder aux paramètres de votre service

1. Connectez-vous à [Render Dashboard](https://dashboard.render.com)
2. Cliquez sur votre service **cargowatch** (ou le nom que vous avez donné)
3. Dans le menu de gauche, cliquez sur **"Settings"**

### Étape 2 : Corriger le Root Directory

1. Faites défiler jusqu'à la section **"Build & Deploy"**
2. Trouvez le champ **"Root Directory"**
3. **⚠️ IMPORTANT** : 
   - Si vous voyez `src` dans ce champ, **SUPPRIMEZ-LE COMPLÈTEMENT**
   - Si le champ contient autre chose que `.`, **EFFACEZ-LE**
   - Le champ doit être **COMPLÈTEMENT VIDE** (ou contenir juste `.` si vous devez mettre quelque chose)

### Étape 3 : Sauvegarder et redéployer

1. Cliquez sur **"Save Changes"** en bas de la page
2. Render va automatiquement redéployer votre service
3. Attendez que le déploiement soit terminé (2-5 minutes)

## 📸 Aide visuelle (texte)

Voici à quoi devrait ressembler la configuration :

```
Build & Deploy Settings
├── Build Command: npm install && npm run build:css
├── Start Command: npm start
└── Root Directory: [VIDE - RIEN D'ÉCRIT ICI] ← ⚠️ C'EST ÇA QUI EST IMPORTANT
```

## 🔍 Vérification

Après le redéploiement, vérifiez les logs :

1. Allez dans l'onglet **"Logs"** de votre service
2. Cherchez des lignes comme :
   ```
   ==> Cloning from https://github.com/...
   ==> Detected Node.js
   ==> Installing dependencies
   ```
3. Si vous voyez toujours l'erreur `package.json not found`, c'est que le Root Directory n'est pas encore correct

## 🚨 Si ça ne fonctionne toujours pas

### Option 1 : Supprimer et recréer le service

1. Dans Render, supprimez le service actuel
2. Créez un nouveau Web Service
3. Lors de la configuration, **ASSUREZ-VOUS** que le champ "Root Directory" est **VIDE**
4. Configurez les autres paramètres normalement

### Option 2 : Vérifier la structure de votre repository

1. Allez sur votre repository GitHub
2. Vérifiez que `package.json` est bien à la **racine** du repository
3. Si `package.json` est dans un sous-dossier, vous devez soit :
   - Le déplacer à la racine
   - OU configurer le Root Directory avec le nom du sous-dossier (mais ce n'est pas recommandé)

## 📝 Checklist de vérification

Avant de redéployer, assurez-vous que :

- [ ] Le champ "Root Directory" dans Render est **VIDE**
- [ ] Le fichier `package.json` existe à la racine de votre repository GitHub
- [ ] Vous avez bien sauvegardé les changements dans Render
- [ ] Le repository est bien connecté à Render

## 💡 Pourquoi cette erreur ?

Render cherche le fichier `package.json` dans :
- ✅ **Correct** : `/opt/render/project/package.json` (si Root Directory est vide)
- ❌ **Incorrect** : `/opt/render/project/src/package.json` (si Root Directory = `src`)

Quand vous laissez le Root Directory vide, Render utilise directement la racine de votre repository cloné.

---

**Une fois corrigé, votre déploiement devrait fonctionner ! 🚀**

