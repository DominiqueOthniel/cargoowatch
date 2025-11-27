-- Script SQL pour créer un shipment de San Francisco vers Fort Worth
-- Expéditeur: mrjacob's cars - 2019 Nissan Altima SL gris
-- Destinataire: Djana Campbell
-- 
-- Copiez et collez ce code dans Supabase SQL Editor
-- Exécutez le script pour créer le shipment

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
    package_vehicle,
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
    'mrjacob''s cars',
    'mrjacob@example.com',
    '+14155551234',
    '{"street": "123 Market Street", "city": "San Francisco", "state": "California", "zipCode": "94102", "country": "US", "lat": 37.7749, "lng": -122.4194}'::jsonb,
    'Djana Campbell',
    'djanacampbell@me.com',
    '630-863-0168',
    '{"street": "6004 Monte Vista Lane Apt 237", "city": "Fort Worth", "state": "Texas", "zipCode": "76132", "country": "US", "lat": 32.6711, "lng": -97.4056}'::jsonb,
    'vehicle',
    3500.00,
    '{"length": 192, "width": 72, "height": 57, "unit": "inches"}'::jsonb,
    '2019 Nissan Altima SL - Grey',
    30000.00,
    'USD',
    '{"year": 2019, "make": "Nissan", "model": "Altima", "trim": "SL", "color": "Grey", "vin": ""}'::jsonb,
    'standard',
    'normal',
    true,
    '[{"id": "evt-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8)) || '", "status": "pending", "title": "Shipment Created", "description": "Your shipment has been created and is awaiting pickup", "location": "San Francisco, California", "timestamp": "' || NOW()::TEXT || '", "completed": true, "current": false}]'::jsonb,
    0.00,
    0.00,
    300.00,
    300.00,
    'USD',
    NOW() + INTERVAL '5 days',
    '{"lat": 37.7749, "lng": -122.4194, "city": "San Francisco"}'::jsonb,
    '{"enabled": true, "paused": false, "pausedAt": null, "pauseReason": null, "pausedDuration": 0, "startedAt": null, "lastUpdate": null}'::jsonb
)
RETURNING tracking_id, id, status, created_at;
