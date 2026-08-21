/* Pending vehicle shipment CA -> TX (live-ready). Paste in Supabase SQL Editor. */

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
    'California Auto Logistics',
    'pickup@calogistics.com',
    '+13105550188',
    jsonb_build_object(
      'street', '1200 South Figueroa Street',
      'city', 'Los Angeles',
      'state', 'California',
      'zip', '90015',
      'country', 'US',
      'lat', 34.0407,
      'lng', -118.2661
    ),
    'Jordan Blake',
    'jordan.blake@email.com',
    '+14695550177',
    jsonb_build_object(
      'street', '2100 Ross Avenue',
      'city', 'Dallas',
      'state', 'Texas',
      'zip', '75201',
      'country', 'US',
      'lat', 32.7876,
      'lng', -96.7997
    ),
    'vehicle',
    4100.00,
    jsonb_build_object('length', 192.0, 'width', 74.0, 'height', 57.5, 'unit', 'inches'),
    '2022 Honda Accord Sport Crystal Black - CA to TX vehicle transport',
    26500.00,
    'USD',
    jsonb_build_object(
      'year', 2022,
      'make', 'Honda',
      'model', 'Accord',
      'trim', 'Sport',
      'color', 'Crystal Black',
      'vin', '1HGCV1F34NA123456',
      'licensePlate', '7ABC901',
      'condition', 'Used'
    ),
    'standard',
    'normal',
    true,
    jsonb_build_array(
      jsonb_build_object(
        'id', 'evt-001',
        'status', 'pending',
        'title', 'Shipment registered',
        'description', 'Label created. Awaiting courier pickup.',
        'location', 'Los Angeles, California',
        'timestamp', (NOW() AT TIME ZONE 'utc'),
        'completed', true,
        'current', true
      )
    ),
    200.00,
    980.00,
    320.00,
    1500.00,
    'USD',
    NOW() + INTERVAL '5 days',
    jsonb_build_object(
      'lat', 34.0407,
      'lng', -118.2661,
      'city', 'Los Angeles',
      'state', 'California'
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
RETURNING tracking_id, status, auto_progress;
