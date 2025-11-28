-- Script SQL pour créer un shipment de véhicule de San Francisco vers Fort Worth, Texas
-- Destinataire: Todjana Campbell
-- Véhicule: 2019 Nissan Altima SL Grey
-- 
-- Copiez et collez ce code dans Supabase SQL Editor
-- https://app.supabase.com/project/msdgzzjvkcsvdmqkgrxa/sql/new

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
    'San Francisco Shipping Center',
    'sf@cargowatch.com',
    '+14155551234',
    '{"street": "123 Market Street", "city": "San Francisco", "state": "California", "zipCode": "94102", "country": "US", "lat": 37.7749, "lng": -122.4194}'::jsonb,
    'Todjana Campbell',
    'djanacampbell@me.com',
    '630-863-0168',
    '{"street": "6004 Monte Visa Lane Apt 237", "city": "Fort Worth", "state": "Texas", "zipCode": "76132", "country": "US", "lat": 32.7555, "lng": -97.3308}'::jsonb,
    'vehicle',
    3500.00,  -- Approximate weight of a Nissan Altima in pounds
    '{"length": 192.9, "width": 72.9, "height": 57.9, "unit": "inches"}'::jsonb,
    '2019 Nissan Altima SL Grey - Vehicle Shipment',
    25000.00,  -- Estimated vehicle value
    'USD',
    '{"year": 2019, "make": "Nissan", "model": "Altima", "trim": "SL", "color": "Grey", "vin": "", "licensePlate": "", "condition": "Used"}'::jsonb,
    'standard',
    'normal',
    true,
    '[{"id": "evt-' || SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8) || '", "status": "pending", "title": "Shipment Created", "description": "Your vehicle shipment has been created and is awaiting pickup", "location": "San Francisco, California", "timestamp": "' || NOW()::TEXT || '", "completed": true, "current": false}]'::jsonb,
    150.00,  -- Base cost
    0.00,  -- Shipping cost (free shipping)
    300.00,  -- Insurance cost
    450.00,  -- Total cost
    'USD',
    NOW() + INTERVAL '5 days',  -- Estimated delivery in 5 days
    '{"lat": 37.7749, "lng": -122.4194, "city": "San Francisco"}'::jsonb,
    '{"enabled": true, "paused": false, "pausedAt": null, "pauseReason": null, "pausedDuration": 0, "startedAt": null, "lastUpdate": null}'::jsonb
)
RETURNING tracking_id, status, recipient_name, recipient_email, cost_total, cost_currency, package_vehicle;

