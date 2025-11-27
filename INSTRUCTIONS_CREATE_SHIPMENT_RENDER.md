# Instructions : Créer un shipment sur Render

## Problème résolu

Le serveur a été modifié pour utiliser Supabase au lieu des fichiers JSON. Les shipments créés seront maintenant sauvegardés dans Supabase et seront visibles sur Render.

## Configuration requise

### 1. Variables d'environnement sur Render

Assurez-vous que les variables d'environnement suivantes sont configurées sur Render :

- `SUPABASE_URL` : L'URL de votre projet Supabase
- `SUPABASE_SERVICE_ROLE_KEY` : La clé service role de Supabase
- `USE_SUPABASE=true` : Active l'utilisation de Supabase

### 2. Créer le shipment

#### Option A : Depuis votre machine locale (recommandé)

1. Obtenez l'URL de votre application Render (ex: `https://cargowatch.onrender.com`)

2. Exécutez le script avec l'URL de Render :

```bash
cd Tracking
RENDER_URL=https://votre-app.onrender.com node create-shipment-oklahoma-texas.js
```

#### Option B : Depuis le serveur Render (via SSH ou console)

Si vous avez accès au serveur Render, vous pouvez exécuter le script directement :

```bash
cd Tracking
node create-shipment-oklahoma-texas.js
```

(Le script utilisera automatiquement l'URL locale du serveur)

## Vérification

Après avoir créé le shipment, vous devriez voir :

1. ✅ Un message de confirmation avec le Tracking ID
2. 📋 Les détails du shipment (expéditeur, destinataire, coût)
3. 🔗 L'URL de suivi

Le shipment sera maintenant visible dans votre base de données Supabase et sur l'interface Render.

## Dépannage

### Le shipment n'apparaît pas dans Supabase

1. Vérifiez que `USE_SUPABASE=true` est défini sur Render
2. Vérifiez que les clés Supabase sont correctes
3. Vérifiez les logs du serveur Render pour voir s'il y a des erreurs
4. Vérifiez que les tables Supabase existent (exécutez `supabase-schema-complete.sql`)

### Erreur de connexion

Si vous obtenez une erreur `ECONNREFUSED` :
- Vérifiez que l'URL de Render est correcte
- Vérifiez que l'application Render est active (pas en veille)
- Attendez quelques secondes après le démarrage de Render

## Détails du shipment créé

- **Expéditeur** : Oklahoma City, Oklahoma
- **Destinataire** : Djana Campbell
- **Adresse** : 6004 Monta Vista Lane Apt 237, Fort Worth, Texas, 76132
- **Type** : Boîte moyenne
- **Poids** : 5.5 kg
- **Coût total** : 65.00 USD

