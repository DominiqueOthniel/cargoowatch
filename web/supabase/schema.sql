-- Aurex Logistics Next.js — schéma Supabase (Auth + RLS)
-- Exécuter dans Supabase SQL Editor

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLES
-- =====================================================

CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255), -- legacy / optional when using Supabase Auth
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'client' CHECK (role IN ('user', 'admin', 'client')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.shipments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tracking_id VARCHAR(50) UNIQUE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered', 'exception')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    delivered_at TIMESTAMPTZ,
    sender_name VARCHAR(255),
    sender_email VARCHAR(255),
    sender_phone VARCHAR(50),
    sender_address JSONB DEFAULT '{}',
    recipient_name VARCHAR(255),
    recipient_email VARCHAR(255),
    recipient_phone VARCHAR(50),
    recipient_address JSONB DEFAULT '{}',
    package_type VARCHAR(50),
    package_weight DECIMAL(10, 2),
    package_dimensions JSONB DEFAULT '{}',
    package_description TEXT,
    package_value DECIMAL(10, 2),
    package_currency VARCHAR(10) DEFAULT 'USD',
    package_vehicle JSONB DEFAULT '{}',
    service_type VARCHAR(50),
    service_priority VARCHAR(50),
    service_insurance BOOLEAN DEFAULT false,
    events JSONB DEFAULT '[]',
    cost_base DECIMAL(10, 2),
    cost_shipping DECIMAL(10, 2),
    cost_insurance DECIMAL(10, 2),
    cost_total DECIMAL(10, 2),
    cost_currency VARCHAR(10) DEFAULT 'USD',
    estimated_delivery TIMESTAMPTZ,
    current_location JSONB DEFAULT '{}',
    auto_progress JSONB DEFAULT '{"enabled": true, "paused": false, "pausedAt": null, "pauseReason": null, "pausedDuration": 0, "startedAt": null, "lastUpdate": null}',
    receipt VARCHAR(500),
    receipt_uploaded_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.chat_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_name VARCHAR(255) NOT NULL,
    client_email VARCHAR(255) NOT NULL,
    subject VARCHAR(500),
    tracking_id VARCHAR(50),
    status VARCHAR(50) DEFAULT 'open' CHECK (status IN ('open', 'active', 'closed', 'resolved')),
    assigned_to UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    image VARCHAR(500),
    sender_type VARCHAR(50) NOT NULL CHECK (sender_type IN ('client', 'admin')),
    sender_name VARCHAR(255),
    sender_id UUID,
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shipments_tracking_id ON public.shipments(tracking_id);
CREATE INDEX IF NOT EXISTS idx_shipments_status ON public.shipments(status);
CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation ON public.chat_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_email ON public.chat_conversations(client_email);

-- =====================================================
-- AUTH TRIGGER: create public.users row on signup
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, username, role, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'client'),
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- HELPERS
-- =====================================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid() AND u.role = 'admin'
  );
$$;

-- =====================================================
-- RLS
-- =====================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- users
DROP POLICY IF EXISTS "users_select_own_or_admin" ON public.users;
CREATE POLICY "users_select_own_or_admin" ON public.users
  FOR SELECT USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "users_update_own_or_admin" ON public.users;
CREATE POLICY "users_update_own_or_admin" ON public.users
  FOR UPDATE USING (auth.uid() = id OR public.is_admin());

-- shipments: public read (tracking), admin write
DROP POLICY IF EXISTS "shipments_public_read" ON public.shipments;
CREATE POLICY "shipments_public_read" ON public.shipments
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "shipments_admin_insert" ON public.shipments;
CREATE POLICY "shipments_admin_insert" ON public.shipments
  FOR INSERT WITH CHECK (public.is_admin() OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "shipments_admin_update" ON public.shipments;
CREATE POLICY "shipments_admin_update" ON public.shipments
  FOR UPDATE USING (public.is_admin() OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "shipments_admin_delete" ON public.shipments;
CREATE POLICY "shipments_admin_delete" ON public.shipments
  FOR DELETE USING (public.is_admin() OR auth.role() = 'service_role');

-- Note: API routes use service_role key, so they bypass RLS.
-- Policies above protect direct client access.

-- chats: allow insert/select for open support (service role handles most ops)
DROP POLICY IF EXISTS "chats_select" ON public.chat_conversations;
CREATE POLICY "chats_select" ON public.chat_conversations
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "chats_insert" ON public.chat_conversations;
CREATE POLICY "chats_insert" ON public.chat_conversations
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "chats_update_admin" ON public.chat_conversations;
CREATE POLICY "chats_update_admin" ON public.chat_conversations
  FOR UPDATE USING (public.is_admin() OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "messages_select" ON public.chat_messages;
CREATE POLICY "messages_select" ON public.chat_messages
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "messages_insert" ON public.chat_messages;
CREATE POLICY "messages_insert" ON public.chat_messages
  FOR INSERT WITH CHECK (true);

-- =====================================================
-- REALTIME
-- =====================================================
-- In Supabase Dashboard > Database > Replication:
-- Enable realtime for chat_messages (and optionally chat_conversations)

ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
-- If already added, ignore the error.

-- =====================================================
-- STORAGE (receipts PDF)
-- =====================================================
-- In Supabase Dashboard > Storage > New bucket:
--   Name: receipts
--   Public: YES
-- Or run (requires storage admin):
-- insert into storage.buckets (id, name, public) values ('receipts', 'receipts', true)
--   on conflict (id) do update set public = true;
-- 1. Authentication > Users > Add user
--    email: admin@aurexlogistics.com
--    password: (choose a strong password)
--    Auto Confirm: ON
-- 2. Then run (replace UUID):
--
-- UPDATE public.users SET role = 'admin', username = 'admin'
-- WHERE email = 'admin@aurexlogistics.com';
--
-- If the trigger did not create the row yet:
-- INSERT INTO public.users (id, email, username, role)
-- SELECT id, email, 'admin', 'admin' FROM auth.users WHERE email = 'admin@aurexlogistics.com'
-- ON CONFLICT (id) DO UPDATE SET role = 'admin';
