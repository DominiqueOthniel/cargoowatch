# Configuration Supabase - CargoWatch

## ✅ Configuration terminée

Votre projet est maintenant configuré pour utiliser Supabase avec les nouvelles clés.

### 📋 Informations Supabase

- **URL** : `https://msdgzzjvkcsvdmqkgrxa.supabase.co`
- **Service Role Key** : Configurée (bypass RLS)
- **Projet** : `msdgzzjvkcsvdmqkgrxa`

### 🔑 Variables d'environnement

Créez un fichier `.env` à la racine du projet avec :

```env
SUPABASE_URL=https://msdgzzjvkcsvdmqkgrxa.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1zZGd6emp2a2NzdmRtcWtncnhhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjI4MTgwOCwiZXhwIjoyMDc3ODU3ODA4fQ.iF_EnY_CSUw8v4Lv8ViVqrxfJKEmxBgrEcJ1uq3FPyo
USE_SUPABASE=true
SESSION_SECRET=u1OYQiOCy4zQsoPkJ1Y5tmitXoHxSQtHWIRirEQ0bxY=
PORT=3000
NODE_ENV=development
```

⚠️ **IMPORTANT** : Le fichier `.env` est déjà dans `.gitignore` et ne sera pas commité.

### 🗄️ Création des tables

1. Allez sur [Supabase SQL Editor](https://app.supabase.com/project/msdgzzjvkcsvdmqkgrxa/sql/new)
2. Ouvrez le fichier `supabase-schema-complete.sql`
3. Copiez tout le contenu
4. Collez dans l'éditeur SQL
5. Cliquez sur **"Run"** ou `Ctrl+Enter`

### 📊 Tables créées

- ✅ `users` - Utilisateurs (clients et admins)
- ✅ `shipments` - Envois/shipments
- ✅ `chat_conversations` - Conversations de chat
- ✅ `chat_messages` - Messages individuels

### 🔍 Vérification

Après avoir exécuté le SQL, vérifiez que les tables existent :

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

### 🚀 Démarrage

Une fois les tables créées :

```bash
npm start
```

Le serveur devrait afficher :
```
✅ Using Supabase database
🚀 CargoWatch Server running on http://localhost:3000
```

### ⚠️ Notes importantes

1. **Service Role Key** : Cette clé bypass RLS (Row Level Security)
   - ✅ Utilisez-la uniquement côté serveur
   - ❌ NE JAMAIS l'exposer côté client
   - ✅ Parfaite pour les opérations backend

2. **RLS (Row Level Security)** : 
   - Les politiques RLS sont configurées pour permettre l'accès en développement
   - Pour la production, modifiez les politiques selon vos besoins

3. **Fallback** : Si Supabase n'est pas configuré, le système utilise automatiquement les fichiers JSON

### 📁 Fichiers créés/modifiés

- ✅ `supabase-config.js` - Configuration Supabase
- ✅ `supabase-db.js` - Fonctions de base de données
- ✅ `supabase-schema-complete.sql` - Schéma SQL complet
- ✅ `server.js` - Mis à jour pour utiliser Supabase
- ✅ `env.example.txt` - Exemple de variables d'environnement

### 🐛 Dépannage

**Problème** : "Supabase credentials not found"
- Vérifiez que le fichier `.env` existe et contient les bonnes variables
- Redémarrez le serveur après avoir créé/modifié `.env`

**Problème** : "relation does not exist"
- Exécutez le script SQL `supabase-schema-complete.sql` dans Supabase

**Problème** : Le serveur utilise toujours JSON
- Vérifiez que `USE_SUPABASE=true` est dans `.env`
- Vérifiez que les variables `SUPABASE_URL` et `SUPABASE_SERVICE_ROLE_KEY` sont définies

### 📚 Ressources

- [Dashboard Supabase](https://app.supabase.com/project/msdgzzjvkcsvdmqkgrxa)
- [Documentation Supabase](https://supabase.com/docs)
- [SQL Editor](https://app.supabase.com/project/msdgzzjvkcsvdmqkgrxa/sql/new)

