# CargoWatch - Professional Shipment Tracking System

Système de suivi de cargaison professionnel avec API REST complète.

## 🚀 Démarrage rapide

### Installation

```bash
npm install
```

### Lancer le serveur

```bash
npm start
# ou
npm run server
```

Le serveur sera accessible sur `http://localhost:3000`

## 📋 Fonctionnalités

- ✅ **Création de shipments** - Formulaire complet avec validation
- ✅ **Tracking en temps réel** - Suivi des colis avec historique d'événements
- ✅ **API REST complète** - Endpoints pour toutes les opérations
- ✅ **Stockage JSON** - Base de données simple (facilement migrable vers Supabase)
- ✅ **Interface moderne** - Design responsive avec Tailwind CSS

## 🔌 API Endpoints

### GET `/api/shipments/:trackingId`
Récupère les détails d'un shipment par son tracking ID

**Exemple:**
```bash
curl http://localhost:3000/api/shipments/CW20251101ABC123
```

### POST `/api/shipments`
Crée un nouveau shipment

**Exemple:**
```bash
curl -X POST http://localhost:3000/api/shipments \
  -H "Content-Type: application/json" \
  -d '{
    "sender": {
      "name": "John Doe",
      "email": "john@example.com",
      "address": {
        "street": "123 Main St",
        "city": "New York",
        "state": "NY",
        "zipCode": "10001",
        "country": "US"
      }
    },
    "recipient": {
      "name": "Jane Smith",
      "email": "jane@example.com",
      "address": {
        "street": "456 Oak Ave",
        "city": "Los Angeles",
        "state": "CA",
        "zipCode": "90001",
        "country": "US"
      }
    },
    "package": {
      "weight": 5.5,
      "dimensions": {
        "length": 12,
        "width": 8,
        "height": 6
      },
      "description": "Electronics"
    }
  }'
```

### PUT `/api/shipments/:trackingId/status`
Met à jour le statut d'un shipment

**Exemple:**
```bash
curl -X PUT http://localhost:3000/api/shipments/CW20251101ABC123/status \
  -H "Content-Type: application/json" \
  -d '{
    "status": "in_transit",
    "location": "Chicago, IL",
    "description": "Package is in transit"
  }'
```

### GET `/api/shipments`
Liste tous les shipments (avec pagination)

**Exemple:**
```bash
curl http://localhost:3000/api/shipments?limit=10&offset=0
```

## 📁 Structure des données

Les shipments sont stockés dans `data/shipments.json`. Chaque shipment contient:

- `id` - UUID unique
- `trackingId` - ID de tracking (format: CWYYYYMMDDXXXXXX)
- `status` - Statut actuel (pending, picked_up, in_transit, out_for_delivery, delivered, exception)
- `sender` - Informations expéditeur
- `recipient` - Informations destinataire
- `package` - Détails du colis
- `events` - Historique des événements
- `cost` - Coûts associés
- `createdAt` / `updatedAt` - Timestamps

## 🔄 Migration vers Supabase

Le projet est préparé pour une migration facile vers Supabase:

1. Créez un projet sur [supabase.com](https://supabase.com)
2. Copiez `config/supabase.example.js` vers `config/supabase.js`
3. Remplissez vos credentials Supabase
4. Installez `@supabase/supabase-js`: `npm install @supabase/supabase-js`
5. Modifiez `server.js` pour utiliser Supabase au lieu de JSON

Voir `config/supabase.example.js` pour la structure de tables suggérée.

## 🛠️ Scripts disponibles

- `npm start` - Lance le serveur Express
- `npm run server` - Alias pour `npm start`
- `npm run build:css` - Compile Tailwind CSS
- `npm run watch:css` - Compile Tailwind CSS en mode watch
- `npm run dev` - Lance le watch CSS

## 📝 Notes

- Les données sont stockées localement dans `data/shipments.json`
- Le dossier `data/` est ignoré par git (voir `.gitignore`)
- Les fichiers de configuration Supabase sont également ignorés

## 🎯 Prochaines étapes

- [ ] Migration vers Supabase
- [ ] Authentification utilisateur
- [ ] Notifications email/SMS
- [ ] Intégration avec services de livraison réels
- [ ] Dashboard admin complet
