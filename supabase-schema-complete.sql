-- =====================================================
-- CargoWatch - Schéma SQL Complet pour Supabase
-- =====================================================
-- Exécutez ce script dans votre Supabase SQL Editor
-- https://app.supabase.com/project/_/sql/new
-- =====================================================

-- Activer l'extension UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLE: users
-- =====================================================
-- Table des utilisateurs (clients et admins)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('user', 'admin', 'client')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABLE: shipments
-- =====================================================
-- Table des envois/shipments
CREATE TABLE IF NOT EXISTS shipments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tracking_id VARCHAR(50) UNIQUE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered', 'exception')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    delivered_at TIMESTAMP WITH TIME ZONE,
    
    -- Informations expéditeur
    sender_name VARCHAR(255),
    sender_email VARCHAR(255),
    sender_phone VARCHAR(50),
    sender_address JSONB DEFAULT '{}',
    
    -- Informations destinataire
    recipient_name VARCHAR(255),
    recipient_email VARCHAR(255),
    recipient_phone VARCHAR(50),
    recipient_address JSONB DEFAULT '{}',
    
    -- Informations colis
    package_type VARCHAR(50),
    package_weight DECIMAL(10, 2),
    package_dimensions JSONB DEFAULT '{}',
    package_description TEXT,
    package_value DECIMAL(10, 2),
    package_currency VARCHAR(10) DEFAULT 'USD',
    package_vehicle JSONB DEFAULT '{}',
    
    -- Informations service
    service_type VARCHAR(50),
    service_priority VARCHAR(50),
    service_insurance BOOLEAN DEFAULT false,
    
    -- Événements (stockés comme tableau JSONB)
    events JSONB DEFAULT '[]',
    
    -- Informations coûts
    cost_base DECIMAL(10, 2),
    cost_shipping DECIMAL(10, 2),
    cost_insurance DECIMAL(10, 2),
    cost_total DECIMAL(10, 2),
    cost_currency VARCHAR(10) DEFAULT 'USD',
    
    -- Informations localisation
    estimated_delivery TIMESTAMP WITH TIME ZONE,
    current_location JSONB DEFAULT '{}',
    
    -- Progression automatique
    auto_progress JSONB DEFAULT '{
        "enabled": true,
        "paused": false,
        "pausedAt": null,
        "pauseReason": null,
        "pausedDuration": 0,
        "startedAt": null,
        "lastUpdate": null
    }',
    
    -- Informations reçu/receipt
    receipt VARCHAR(500),
    receipt_uploaded_at TIMESTAMP WITH TIME ZONE
);

-- =====================================================
-- TABLE: chat_conversations
-- =====================================================
-- Table des conversations de chat
CREATE TABLE IF NOT EXISTS chat_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_name VARCHAR(255) NOT NULL,
    client_email VARCHAR(255) NOT NULL,
    subject VARCHAR(500),
    tracking_id VARCHAR(50),
    status VARCHAR(50) DEFAULT 'open' CHECK (status IN ('open', 'active', 'closed', 'resolved')),
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABLE: chat_messages
-- =====================================================
-- Table des messages individuels dans les conversations
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    image VARCHAR(500),
    sender_type VARCHAR(50) NOT NULL CHECK (sender_type IN ('client', 'admin')),
    sender_name VARCHAR(255) NOT NULL,
    sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INDEXES pour améliorer les performances
-- =====================================================

-- Index pour shipments
CREATE INDEX IF NOT EXISTS idx_shipments_tracking_id ON shipments(tracking_id);
CREATE INDEX IF NOT EXISTS idx_shipments_status ON shipments(status);
CREATE INDEX IF NOT EXISTS idx_shipments_created_at ON shipments(created_at);
CREATE INDEX IF NOT EXISTS idx_shipments_sender_email ON shipments(sender_email);
CREATE INDEX IF NOT EXISTS idx_shipments_recipient_email ON shipments(recipient_email);
CREATE INDEX IF NOT EXISTS idx_shipments_tracking_id_upper ON shipments(UPPER(tracking_id));

-- Index pour users
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Index pour chat_conversations
CREATE INDEX IF NOT EXISTS idx_chat_conversations_client_email ON chat_conversations(client_email);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_tracking_id ON chat_conversations(tracking_id);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_status ON chat_conversations(status);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_assigned_to ON chat_conversations(assigned_to);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_created_at ON chat_conversations(created_at);

-- Index pour chat_messages
CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation_id ON chat_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_chat_messages_read ON chat_messages(read);

-- =====================================================
-- FONCTIONS pour les triggers
-- =====================================================

-- Fonction pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- =====================================================
-- TRIGGERS pour updated_at automatique
-- =====================================================

-- Trigger pour users
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger pour shipments
DROP TRIGGER IF EXISTS update_shipments_updated_at ON shipments;
CREATE TRIGGER update_shipments_updated_at
    BEFORE UPDATE ON shipments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger pour chat_conversations
DROP TRIGGER IF EXISTS update_chat_conversations_updated_at ON chat_conversations;
CREATE TRIGGER update_chat_conversations_updated_at
    BEFORE UPDATE ON chat_conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FONCTIONS UTILITAIRES (optionnel)
-- =====================================================

-- Fonction pour obtenir le nombre de messages non lus d'une conversation
CREATE OR REPLACE FUNCTION get_unread_message_count(conv_id UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)
        FROM chat_messages
        WHERE conversation_id = conv_id AND read = false
    );
END;
$$ LANGUAGE plpgsql;

-- Fonction pour obtenir le dernier message d'une conversation
CREATE OR REPLACE FUNCTION get_last_message(conv_id UUID)
RETURNS TABLE (
    id UUID,
    text TEXT,
    sender_name VARCHAR,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cm.id,
        cm.text,
        cm.sender_name,
        cm.created_at
    FROM chat_messages cm
    WHERE cm.conversation_id = conv_id
    ORDER BY cm.created_at DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- VUES UTILES (optionnel)
-- =====================================================

-- Vue pour les conversations avec le dernier message
CREATE OR REPLACE VIEW chat_conversations_with_last_message AS
SELECT 
    cc.*,
    cm.id as last_message_id,
    cm.text as last_message_text,
    cm.sender_name as last_message_sender,
    cm.created_at as last_message_at,
    (SELECT COUNT(*) FROM chat_messages WHERE conversation_id = cc.id AND read = false) as unread_count
FROM chat_conversations cc
LEFT JOIN LATERAL (
    SELECT * FROM chat_messages 
    WHERE conversation_id = cc.id 
    ORDER BY created_at DESC 
    LIMIT 1
) cm ON true;

-- =====================================================
-- DONNÉES PAR DÉFAUT (optionnel)
-- =====================================================

-- Créer un utilisateur admin par défaut (mot de passe: admin123)
-- ⚠️ Changez ce mot de passe après la création !
-- Le mot de passe est hashé avec bcrypt: $2a$10$yD.jUcIncGwMYHbaTntK5Owl3n2XzVCXE1HD5MePWLRrn6ZUCGTlm
INSERT INTO users (id, username, email, password, role, first_name, last_name)
VALUES (
    '46432134-7ab8-45ce-a2cf-dc0dc2df43cc',
    'admin',
    'admin@cargowatch.com',
    '$2a$10$yD.jUcIncGwMYHbaTntK5Owl3n2XzVCXE1HD5MePWLRrn6ZUCGTlm',
    'admin',
    'Admin',
    'User'
)
ON CONFLICT (email) DO NOTHING;

-- =====================================================
-- POLITIQUES RLS (Row Level Security)
-- =====================================================
-- ⚠️ Pour le développement, vous pouvez désactiver RLS temporairement
-- ⚠️ Pour la production, créez des politiques appropriées

-- Activer RLS sur toutes les tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Politique temporaire pour permettre tout en développement
-- ⚠️ REMPLACEZ par des politiques sécurisées en production !

-- Politique pour users (tous peuvent lire, seuls les admins peuvent modifier)
CREATE POLICY "Users can read all" ON users FOR SELECT USING (true);
CREATE POLICY "Users can insert own" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can update all" ON users FOR UPDATE USING (true);

-- Politique pour shipments (tous peuvent lire, seuls les admins peuvent modifier)
CREATE POLICY "Anyone can read shipments" ON shipments FOR SELECT USING (true);
CREATE POLICY "Admins can insert shipments" ON shipments FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can update shipments" ON shipments FOR UPDATE USING (true);

-- Politique pour chat_conversations
CREATE POLICY "Users can read conversations" ON chat_conversations FOR SELECT USING (true);
CREATE POLICY "Users can create conversations" ON chat_conversations FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update conversations" ON chat_conversations FOR UPDATE USING (true);

-- Politique pour chat_messages
CREATE POLICY "Users can read messages" ON chat_messages FOR SELECT USING (true);
CREATE POLICY "Users can create messages" ON chat_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update messages" ON chat_messages FOR UPDATE USING (true);

-- =====================================================
-- FIN DU SCRIPT
-- =====================================================
-- Vérifiez que toutes les tables ont été créées :
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' 
-- ORDER BY table_name;
-- =====================================================

