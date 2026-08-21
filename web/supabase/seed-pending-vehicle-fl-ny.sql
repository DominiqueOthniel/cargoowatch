/* Pending vehicle shipment FL -> NY (live-ready). Paste in Supabase SQL Editor. */

INSERT INTO public.shipments (
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
    'CW' || TO_CHAR(NOW(), 'YYYYMMDD') || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8)),
    'pending',
    'Miami Vehicle Depot',
    'miami@aurexlogistics.com',
    '+13055550123',
    jsonb_build_object(
      'street', '1000 NW 42nd Avenue',
      'city', 'Miami',
      'state', 'Florida',
      'zip', '33126',
      'country', 'US',
      'lat', 25.7781,
      'lng', -80.2740
    ),
    'Avery Collins',
    'avery.collins@email.com',
    '+12125550198',
    jsonb_build_object(
      'street', '350 Fifth Avenue',
      'city', 'New York',
      'state', 'New York',
      'zip', '10118',
      'country', 'US',
      'lat', 40.7484,
      'lng', -73.9857
    ),
    'vehicle',
    3950.00,
    jsonb_build_object('length', 188.0, 'width', 73.0, 'height', 56.0, 'unit', 'inches'),
    '2020 Ford Mustang GT Race Red - FL to NY vehicle transport',
    32000.00,
    'USD',
    jsonb_build_object(
      'year', 2020,
      'make', 'Ford',
      'model', 'Mustang',
      'trim', 'GT',
      'color', 'Race Red',
      'vin', '1FA6P8CF5L5123456',
      'licensePlate', 'FLMUST20',
      'condition', 'Used'
    ),
    'express',
    'high',
    true,
    jsonb_build_array(
      jsonb_build_object(
        'id', 'evt-001',
        'status', 'pending',
        'title', 'Shipment registered',
        'description', 'Label created. Awaiting courier pickup.',
        'location', 'Miami, Florida',
        'timestamp', (NOW() AT TIME ZONE 'utc'),
        'completed', true,
        'current', true
      )
    ),
    250.00,
    1250.00,
    400.00,
    1900.00,
    'USD',
    NOW() + INTERVAL '4 days',
    jsonb_build_object(
      'lat', 25.7781,
      'lng', -80.2740,
      'city', 'Miami',
      'state', 'Florida'
    ),
    jsonb_build_object(
      'enabled', true,
      'paused', false,
      'pausedAt', null,
      'pauseReason', null,
      'pausedDuration', 0,
      'startedAt', null,
      'lastUpdate', null
    )
)
RETURNING tracking_id, status, sender_name, recipient_name;
