# Instructions : Créer un shipment sur Render

## Configuration actuelle

Le serveur utilise actuellement les fichiers JSON pour stocker les données. Une migration vers MongoDB est prévue.

## Créer le shipment

### Option A : Depuis votre machine locale (recommandé)

1. Obtenez l'URL de votre application Render (ex: `https://cargowatch.onrender.com`)

2. Exécutez le script avec l'URL de Render :

**Sans date personnalisée (date calculée automatiquement) :**
```bash
cd Tracking
RENDER_URL=https://votre-app.onrender.com node create-shipment-oklahoma-texas.js
```

**Avec date de livraison personnalisée :**
```bash
cd Tracking
# Format ISO 8601
RENDER_URL=https://votre-app.onrender.com node create-shipment-oklahoma-texas.js "2024-12-15T10:00:00Z"

# Format date simple (sera convertie en 12:00 UTC)
RENDER_URL=https://votre-app.onrender.com node create-shipment-oklahoma-texas.js "2024-12-15"

# Via variable d'environnement
RENDER_URL=https://votre-app.onrender.com DELIVERY_DATE="2024-12-15T10:00:00Z" node create-shipment-oklahoma-texas.js
```

### Option B : Depuis le serveur Render (via SSH ou console)

Si vous avez accès au serveur Render, vous pouvez exécuter le script directement :

```bash
cd Tracking
# Sans date
node create-shipment-oklahoma-texas.js

# Avec date
node create-shipment-oklahoma-texas.js "2024-12-15T10:00:00Z"
```

(Le script utilisera automatiquement l'URL locale du serveur)

### 3. Formats de date acceptés

Le script accepte plusieurs formats de date :

- **ISO 8601** : `"2024-12-15T10:00:00Z"` (recommandé)
- **Date simple** : `"2024-12-15"` (sera convertie en 12:00 UTC)
- **Timestamp** : `"1734264000000"` (millisecondes depuis l'époque Unix)

Si aucune date n'est fournie, le serveur calculera automatiquement la date d'arrivée estimée en fonction de la distance entre l'expéditeur et le destinataire.

## Vérification

Après avoir créé le shipment, vous devriez voir :

1. ✅ Un message de confirmation avec le Tracking ID
2. 📋 Les détails du shipment (expéditeur, destinataire, coût)
3. 🔗 L'URL de suivi

Le shipment sera maintenant visible dans votre base de données et sur l'interface Render.

## Dépannage

### Le shipment n'apparaît pas

1. Vérifiez les logs du serveur Render pour voir s'il y a des erreurs
2. Vérifiez que les fichiers JSON sont bien sauvegardés dans le dossier `data/`
3. Vérifiez que l'application Render est active (pas en veille)

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
