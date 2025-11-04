-- Script SQL pour créer un shipment en euros (EUR)
-- Utilisez ce script dans Supabase SQL Editor

-- Exemple de création d'un shipment avec devises en EUR
INSERT INTO shipments (
    id,
    tracking_id,
    status,
    created_at,
    updated_at,
    
    -- Informations expéditeur
    sender_name,
    sender_email,
    sender_phone,
    sender_address,
    
    -- Informations destinataire
    recipient_name,
    recipient_email,
    recipient_phone,
    recipient_address,
    
    -- Informations colis
    package_type,
    package_weight,
    package_dimensions,
    package_description,
    package_value,
    package_currency,  -- EUR pour euros
    package_vehicle,
    
    -- Informations service
    service_type,
    service_priority,
    service_insurance,
    
    -- Événements
    events,
    
    -- Coûts (en EUR)
    cost_base,
    cost_shipping,
    cost_insurance,
    cost_total,
    cost_currency,  -- EUR pour euros
    
    -- Localisation
    estimated_delivery,
    current_location,
    
    -- Auto progression
    auto_progress,
    
    -- Reçu
    receipt,
    receipt_uploaded_at
) VALUES (
    gen_random_uuid(),  -- ID unique
    'CW' || TO_CHAR(NOW(), 'YYYYMMDD') || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 10)),  -- Tracking ID généré
    'pending',  -- Statut initial
    
    NOW(),  -- Date de création
    NOW(),  -- Date de mise à jour
    
    -- Expéditeur
    'Jean Dupont',
    'jean.dupont@example.com',
    '+33 6 12 34 56 78',
    '{
        "street": "123 Rue de la République",
        "city": "Paris",
        "state": "Île-de-France",
        "zipCode": "75001",
        "country": "France",
        "lat": 48.8566,
        "lng": 2.3522
    }'::jsonb,
    
    -- Destinataire
    'Marie Martin',
    'marie.martin@example.com',
    '+33 6 98 76 54 32',
    '{
        "street": "456 Avenue des Champs-Élysées",
        "city": "Lyon",
        "state": "Auvergne-Rhône-Alpes",
        "zipCode": "69001",
        "country": "France",
        "lat": 45.7640,
        "lng": 4.8357
    }'::jsonb,
    
    -- Colis
    'package',  -- Type de colis
    5.5,  -- Poids en kg
    '{
        "length": 30,
        "width": 20,
        "height": 15,
        "unit": "cm"
    }'::jsonb,
    'Documents importants et électronique',
    250.00,  -- Valeur du colis
    'EUR',  -- Devise: EUR (euros)
    '{}'::jsonb,  -- Véhicule (vide)
    
    -- Service
    'standard',  -- Type de service
    'normal',  -- Priorité
    true,  -- Assurance activée
    
    -- Événements initiaux
    '[
        {
            "id": "evt-001",
            "status": "pending",
            "title": "Pending Pickup",
            "description": "Awaiting carrier pickup",
            "location": "Paris, France",
            "timestamp": "2025-11-04T10:00:00Z",
            "completed": false,
            "current": true
        }
    ]'::jsonb,
    
    -- Coûts en EUR
    15.00,  -- Coût de base (EUR)
    25.00,  -- Coût d'expédition (EUR)
    5.00,   -- Coût d'assurance (EUR)
    45.00,  -- Total (EUR)
    'EUR',  -- Devise: EUR (euros)
    
    -- Date de livraison estimée (dans 3 jours)
    NOW() + INTERVAL '3 days',
    
    -- Localisation actuelle
    '{
        "lat": 48.8566,
        "lng": 2.3522,
        "city": "Paris"
    }'::jsonb,
    
    -- Auto progression
    '{
        "enabled": true,
        "paused": false,
        "pausedAt": null,
        "pauseReason": null,
        "pausedDuration": 0,
        "startedAt": null,
        "lastUpdate": null
    }'::jsonb,
    
    -- Reçu
    null,  -- Pas de reçu encore
    null   -- Date de téléchargement du reçu
);

-- Afficher le shipment créé
SELECT 
    tracking_id,
    status,
    sender_name,
    recipient_name,
    package_value,
    package_currency,
    cost_total,
    cost_currency,
    created_at
FROM shipments
WHERE cost_currency = 'EUR'
ORDER BY created_at DESC
LIMIT 1;

