-- Script SQL SIMPLE pour créer un shipment en euros (EUR)
-- Copiez et collez ce code dans Supabase SQL Editor

-- Exemple simple avec valeurs en EUR
INSERT INTO shipments (
    tracking_id,
    status,
    sender_name,
    sender_email,
    sender_phone,
    sender_address,
    recipient_name,
    recipient_email,
    recipient_phone,
    recipient_address,
    package_type,
    package_weight,
    package_dimensions,
    package_description,
    package_value,
    package_currency,
    service_type,
    service_priority,
    service_insurance,
    events,
    cost_base,
    cost_shipping,
    cost_insurance,
    cost_total,
    cost_currency,
    estimated_delivery,
    current_location,
    auto_progress
) VALUES (
    'CW' || TO_CHAR(NOW(), 'YYYYMMDD') || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 10)),
    'pending',
    'Jean Dupont',
    'jean.dupont@example.com',
    '+33 6 12 34 56 78',
    '{"street": "123 Rue de la République", "city": "Paris", "state": "Île-de-France", "zipCode": "75001", "country": "France", "lat": 48.8566, "lng": 2.3522}'::jsonb,
    'Marie Martin',
    'marie.martin@example.com',
    '+33 6 98 76 54 32',
    '{"street": "456 Avenue des Champs-Élysées", "city": "Lyon", "state": "Auvergne-Rhône-Alpes", "zipCode": "69001", "country": "France", "lat": 45.7640, "lng": 4.8357}'::jsonb,
    'package',
    5.5,
    '{"length": 30, "width": 20, "height": 15, "unit": "cm"}'::jsonb,
    'Documents importants',
    250.00,
    'EUR',  -- Devise du colis en EUR
    'standard',
    'normal',
    true,
    '[{"id": "evt-001", "status": "pending", "title": "Pending Pickup", "description": "Awaiting carrier pickup", "location": "Paris, France", "timestamp": "2025-11-04T10:00:00Z", "completed": false, "current": true}]'::jsonb,
    15.00,  -- Coût de base en EUR
    25.00,  -- Coût d'expédition en EUR
    5.00,   -- Coût d'assurance en EUR
    45.00,  -- Total en EUR
    'EUR',  -- Devise des coûts en EUR
    NOW() + INTERVAL '3 days',
    '{"lat": 48.8566, "lng": 2.3522, "city": "Paris"}'::jsonb,
    '{"enabled": true, "paused": false, "pausedAt": null, "pauseReason": null, "pausedDuration": 0, "startedAt": null, "lastUpdate": null}'::jsonb
)
RETURNING tracking_id, status, cost_total, cost_currency, package_value, package_currency;

