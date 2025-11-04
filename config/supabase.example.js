/**
 * Configuration Supabase pour migration future
 * 
 * Pour migrer vers Supabase:
 * 1. Créez un projet sur https://supabase.com
 * 2. Copiez ce fichier vers config/supabase.js
 * 3. Remplissez les valeurs avec vos credentials Supabase
 * 4. Installez: npm install @supabase/supabase-js
 * 5. Mettez à jour server.js pour utiliser Supabase au lieu de JSON
 */

module.exports = {
    supabaseUrl: 'YOUR_SUPABASE_URL',
    supabaseKey: 'YOUR_SUPABASE_ANON_KEY',
    
    // Structure de tables suggérée pour Supabase:
    tables: {
        shipments: {
            name: 'shipments',
            columns: {
                id: 'uuid PRIMARY KEY DEFAULT uuid_generate_v4()',
                tracking_id: 'text UNIQUE NOT NULL',
                status: 'text NOT NULL',
                sender: 'jsonb NOT NULL',
                recipient: 'jsonb NOT NULL',
                package: 'jsonb NOT NULL',
                service: 'jsonb NOT NULL',
                events: 'jsonb DEFAULT \'[]\'::jsonb',
                cost: 'jsonb NOT NULL',
                estimated_delivery: 'timestamp',
                current_location: 'jsonb',
                created_at: 'timestamp DEFAULT NOW()',
                updated_at: 'timestamp DEFAULT NOW()',
                delivered_at: 'timestamp'
            }
        },
        events: {
            name: 'shipment_events',
            columns: {
                id: 'uuid PRIMARY KEY DEFAULT uuid_generate_v4()',
                shipment_id: 'uuid REFERENCES shipments(id)',
                status: 'text NOT NULL',
                title: 'text NOT NULL',
                description: 'text',
                location: 'text',
                timestamp: 'timestamp DEFAULT NOW()',
                completed: 'boolean DEFAULT false',
                current: 'boolean DEFAULT false'
            }
        }
    }
};






