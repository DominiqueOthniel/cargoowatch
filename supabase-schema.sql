-- CargoWatch Supabase Database Schema
-- Run this SQL in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Shipments table
CREATE TABLE IF NOT EXISTS shipments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tracking_id VARCHAR(50) UNIQUE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    delivered_at TIMESTAMP WITH TIME ZONE,
    
    -- Sender information
    sender_name VARCHAR(255),
    sender_email VARCHAR(255),
    sender_phone VARCHAR(50),
    sender_address JSONB,
    
    -- Recipient information
    recipient_name VARCHAR(255),
    recipient_email VARCHAR(255),
    recipient_phone VARCHAR(50),
    recipient_address JSONB,
    
    -- Package information
    package_type VARCHAR(50),
    package_weight DECIMAL(10, 2),
    package_dimensions JSONB,
    package_description TEXT,
    package_value DECIMAL(10, 2),
    package_currency VARCHAR(10) DEFAULT 'USD',
    package_vehicle JSONB DEFAULT '{}',
    
    -- Service information
    service_type VARCHAR(50),
    service_priority VARCHAR(50),
    service_insurance BOOLEAN DEFAULT false,
    
    -- Events (stored as JSONB array)
    events JSONB DEFAULT '[]',
    
    -- Cost information
    cost_base DECIMAL(10, 2),
    cost_shipping DECIMAL(10, 2),
    cost_insurance DECIMAL(10, 2),
    cost_total DECIMAL(10, 2),
    cost_currency VARCHAR(10) DEFAULT 'USD',
    
    -- Location information
    estimated_delivery TIMESTAMP WITH TIME ZONE,
    current_location JSONB,
    
    -- Auto progress
    auto_progress JSONB DEFAULT '{"enabled": true, "paused": false, "pausedAt": null, "pauseReason": null, "pausedDuration": 0, "startedAt": null, "lastUpdate": null}',
    
    -- Receipt information
    receipt VARCHAR(500),
    receipt_uploaded_at TIMESTAMP WITH TIME ZONE
);

-- Chats table
CREATE TABLE IF NOT EXISTS chats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tracking_id VARCHAR(50) NOT NULL,
    user_email VARCHAR(255),
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (tracking_id) REFERENCES shipments(tracking_id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_shipments_tracking_id ON shipments(tracking_id);
CREATE INDEX IF NOT EXISTS idx_shipments_status ON shipments(status);
CREATE INDEX IF NOT EXISTS idx_shipments_created_at ON shipments(created_at);
CREATE INDEX IF NOT EXISTS idx_shipments_sender_email ON shipments(sender_email);
CREATE INDEX IF NOT EXISTS idx_shipments_recipient_email ON shipments(recipient_email);
CREATE INDEX IF NOT EXISTS idx_chats_tracking_id ON chats(tracking_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers to update updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shipments_updated_at BEFORE UPDATE ON shipments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


