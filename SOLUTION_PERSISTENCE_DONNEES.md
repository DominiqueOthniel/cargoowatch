# Solution : Persistance des données après redéploiement

## Problème identifié

Les données disparaissent après chaque redéploiement sur Render car :
1. Les fichiers JSON dans `data/` sont ignorés par Git (`.gitignore`)
2. Render clone le repo depuis GitHub à chaque redéploiement
3. Les fichiers JSON locaux ne sont pas dans le repo → données perdues

## Solution temporaire appliquée ✅

**Modification du `.gitignore`** pour tracker les fichiers JSON :
- Les fichiers `data/*.json` sont maintenant commités dans Git
- Ils seront présents lors du redéploiement sur Render

⚠️ **Note** : Cette solution fonctionne mais n'est pas idéale pour la production car :
- Les données sont versionnées dans Git (peut encombrer le repo)
- Pas de sauvegarde automatique
- Risque de conflits si plusieurs instances

## Solutions recommandées pour la production

### Option 1 : Base de données MongoDB (Recommandé) ⭐

**Avantages** :
- Persistance garantie
- Sauvegardes automatiques
- Scalable
- Gratuit jusqu'à 512MB avec MongoDB Atlas
- NoSQL flexible

**Comment faire** :
1. Créer un compte MongoDB Atlas (gratuit)
2. Créer un cluster gratuit
3. Obtenir l'URI de connexion
4. Modifier `server.js` pour utiliser MongoDB au lieu de JSON
5. Ajouter `MONGODB_URI` dans les variables d'environnement Render

### Option 2 : PostgreSQL sur Render

**Avantages** :
- Base de données dédiée
- Persistance garantie
- Performances élevées
- SQL standard

**Comment faire** :
1. Créer une base PostgreSQL sur Render
2. Configurer les tables
3. Modifier le code pour utiliser PostgreSQL
4. Ajouter la connexion dans les variables d'environnement

### Option 3 : Volume persistant (si disponible sur Render)

**Avantages** :
- Conserve les fichiers locaux
- Pas de changement de code nécessaire

**Comment faire** :
- Vérifier si Render offre des volumes persistants
- Configurer le volume pour le dossier `data/`

## Prochaines étapes

Pour l'instant, la solution temporaire est en place. Les données seront préservées lors des redéploiements.

**Pour une solution durable**, je recommande d'implémenter MongoDB Atlas.

Souhaitez-vous que je vous aide à configurer MongoDB ?
