# 🔧 Fix Urgent : Erreur "package.json not found" sur Render

## ❌ Erreur
```
npm error path /opt/render/project/src/package.json
npm error errno -2
npm error enoent Could not read package.json
```

## ✅ Solution en 3 étapes (OBLIGATOIRE - À faire dans l'interface Render)

⚠️ **IMPORTANT** : Le fichier `render.yaml` est ignoré car le service a été créé via l'interface. 
**Vous DEVEZ modifier la configuration dans l'interface Render manuellement.**

### Étape 1 : Accéder aux paramètres de votre service

1. Connectez-vous à [Render Dashboard](https://dashboard.render.com)
2. Dans la liste des services, **cliquez sur votre service "cargowatch"** (ou le nom que vous avez donné)
3. Dans le menu de gauche (sidebar), cliquez sur **"Settings"** (ou ⚙️ Settings)

### Étape 2 : Corriger le Root Directory (CRITIQUE)

1. Faites défiler la page jusqu'à la section **"Build & Deploy"** (ou "Build Settings")
2. Cherchez le champ **"Root Directory"** dans cette section
3. **⚠️ ACTION CRITIQUE** : 
   - **Cliquez dans le champ "Root Directory"**
   - **Sélectionnez tout le texte** (Ctrl+A ou Cmd+A)
   - **Supprimez-le complètement** (Backspace ou Delete)
   - **Le champ doit être COMPLÈTEMENT VIDE** - ne laissez même pas un espace ou un point
   - Si le champ ne peut pas être complètement vide, mettez juste `.` (un point)

### Étape 3 : Sauvegarder et redéployer

1. Faites défiler jusqu'en bas de la page
2. Cliquez sur le bouton **"Save Changes"** (ou "Save")
3. Render va **automatiquement redéployer** votre service
4. Attendez que le déploiement soit terminé (2-5 minutes)
5. Vérifiez les logs - vous devriez voir `/opt/render/project/package.json` au lieu de `/opt/render/project/src/package.json`

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

### Option 1 : Supprimer et recréer le service (RECOMMANDÉ si vous n'arrivez pas à corriger)

1. Dans Render Dashboard, allez sur votre service
2. Cliquez sur **"Settings"** → **"Delete Service"** (en bas de la page)
3. Confirmez la suppression
4. Créez un **nouveau Web Service**
5. Connectez votre repository GitHub
6. **LORS DE LA CRÉATION**, lors de la configuration :
   - **Name** : `cargowatch`
   - **Root Directory** : ⚠️ **LAISSEZ COMPLÈTEMENT VIDE** (ne mettez rien)
   - **Build Command** : `npm install && npm run build:css`
   - **Start Command** : `npm start`
   - **Runtime** : `Node`
7. Configurez les variables d'environnement après
8. Cliquez sur **"Create Web Service"**

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

