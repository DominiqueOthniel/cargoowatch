# Guide des Schémas SQL - CargoWatch

Ce projet contient deux fichiers SQL pour configurer votre base de données Supabase.

## 📁 Fichiers disponibles

### 1. `supabase-schema.sql` (Version Simplifiée)
**À utiliser si** : Vous voulez une configuration rapide avec les tables de base.

**Contient** :
- ✅ Table `users`
- ✅ Table `shipments`
- ✅ Table `chats` (version simple)
- ✅ Indexes de base
- ✅ Triggers pour `updated_at`

### 2. `supabase-schema-complete.sql` (Version Complète) ⭐ **RECOMMANDÉ**
**À utiliser si** : Vous voulez une structure complète et optimisée pour la production.

**Contient tout ce qui est dans la version simplifiée PLUS** :
- ✅ Table `users` améliorée (avec first_name, last_name)
- ✅ Table `shipments` complète
- ✅ Table `chat_conversations` (structure normalisée)
- ✅ Table `chat_messages` (messages individuels)
- ✅ Indexes optimisés
- ✅ Triggers automatiques
- ✅ Fonctions utilitaires (unread count, last message)
- ✅ Vues SQL (conversations avec dernier message)
- ✅ Politiques RLS (Row Level Security)
- ✅ Utilisateur admin par défaut

## 🚀 Comment utiliser

### Étape 1 : Accéder à Supabase SQL Editor

1. Allez sur [Supabase Dashboard](https://app.supabase.com)
2. Sélectionnez votre projet
3. Allez dans **SQL Editor** (menu de gauche)
4. Cliquez sur **"New query"**

### Étape 2 : Choisir le fichier SQL

**Option A : Version Complète (Recommandée)**
```sql
-- Copiez tout le contenu de supabase-schema-complete.sql
-- Collez-le dans l'éditeur SQL
-- Cliquez sur "Run" ou appuyez sur Ctrl+Enter
```

**Option B : Version Simplifiée**
```sql
-- Copiez tout le contenu de supabase-schema.sql
-- Collez-le dans l'éditeur SQL
-- Cliquez sur "Run" ou appuyez sur Ctrl+Enter
```

### Étape 3 : Vérifier la création

Exécutez cette requête pour vérifier que toutes les tables ont été créées :

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

Vous devriez voir :
- `users`
- `shipments`
- `chat_conversations` (si version complète)
- `chat_messages` (si version complète)
- `chats` (si version simplifiée)

## 📊 Structure des tables

### Table `users`
Stocker les utilisateurs (clients et admins).

**Champs principaux** :
- `id` (UUID)
- `username` (unique)
- `email` (unique)
- `password` (hashé avec bcrypt)
- `role` (user, admin, client)
- `first_name`, `last_name`

### Table `shipments`
Stocker tous les envois/shipments.

**Champs principaux** :
- `id` (UUID)
- `tracking_id` (unique)
- `status` (pending, picked_up, in_transit, etc.)
- `sender_*` (informations expéditeur)
- `recipient_*` (informations destinataire)
- `package_*` (informations colis)
- `events` (JSONB array)
- `cost_*` (informations coûts)

### Table `chat_conversations` (Version Complète)
Stocker les conversations de chat.

**Champs principaux** :
- `id` (UUID)
- `client_name`, `client_email`
- `subject`
- `tracking_id` (optionnel)
- `status` (open, active, closed, resolved)
- `assigned_to` (référence à users.id)

### Table `chat_messages` (Version Complète)
Stocker les messages individuels dans les conversations.

**Champs principaux** :
- `id` (UUID)
- `conversation_id` (référence à chat_conversations)
- `text`, `image`
- `sender_type` (client, admin)
- `sender_name`, `sender_id`
- `read` (boolean)

### Table `chats` (Version Simplifiée)
Version simplifiée qui stocke les conversations avec messages en JSONB.

## 🔒 Sécurité (RLS)

Les politiques RLS (Row Level Security) sont configurées par défaut pour permettre l'accès en développement.

**⚠️ IMPORTANT pour la production** :
- Modifiez les politiques RLS selon vos besoins de sécurité
- Limitez l'accès aux données selon les rôles utilisateurs
- Testez les politiques avant de mettre en production

Pour désactiver temporairement RLS en développement :
```sql
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE shipments DISABLE ROW LEVEL SECURITY;
ALTER TABLE chat_conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages DISABLE ROW LEVEL SECURITY;
```

## 🔧 Fonctions utilitaires (Version Complète)

### `get_unread_message_count(conv_id UUID)`
Retourne le nombre de messages non lus d'une conversation.

**Exemple** :
```sql
SELECT get_unread_message_count('conversation-id-here');
```

### `get_last_message(conv_id UUID)`
Retourne le dernier message d'une conversation.

**Exemple** :
```sql
SELECT * FROM get_last_message('conversation-id-here');
```

## 📋 Vues SQL (Version Complète)

### `chat_conversations_with_last_message`
Vue qui combine les conversations avec leur dernier message et le nombre de messages non lus.

**Exemple** :
```sql
SELECT * FROM chat_conversations_with_last_message
WHERE status = 'open'
ORDER BY last_message_at DESC;
```

## 👤 Utilisateur Admin par défaut

Le schéma complet crée un utilisateur admin par défaut :
- **Username** : `admin`
- **Email** : `admin@cargowatch.com`
- **Password** : `admin123` (⚠️ CHANGEZ-LE IMMÉDIATEMENT !)
- **Role** : `admin`

**⚠️ SÉCURITÉ** : Changez le mot de passe admin après la première connexion !

## 🐛 Dépannage

### Erreur : "relation already exists"
Les tables existent déjà. Pour les recréer :
```sql
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS chat_conversations CASCADE;
DROP TABLE IF EXISTS shipments CASCADE;
DROP TABLE IF EXISTS users CASCADE;
```
Puis réexécutez le script SQL.

### Erreur : "permission denied"
Vérifiez les politiques RLS ou désactivez-les temporairement pour le développement.

### Les données ne s'affichent pas
1. Vérifiez que les tables existent
2. Vérifiez les politiques RLS
3. Vérifiez que `USE_SUPABASE=true` est défini dans votre `.env`

## 📚 Ressources

- [Documentation Supabase](https://supabase.com/docs)
- [Documentation PostgreSQL](https://www.postgresql.org/docs/)
- [Guide de déploiement](DEPLOYMENT_GUIDE.md)

