// Supabase Configuration
require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');

// Get Supabase credentials from environment variables
// Fallback to hardcoded values for development
const supabaseUrl = process.env.SUPABASE_URL || 'https://msdgzzjvkcsvdmqkgrxa.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY;

// ⚠️ IMPORTANT: Service Role Key bypasses RLS (Row Level Security)
// Use this only on the server side, NEVER expose it to the client!
// For client-side, use SUPABASE_ANON_KEY instead

if (!supabaseKey) {
    console.error('❌ Supabase credentials not found!');
    console.error('Please set SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY in your .env file');
    console.error('You can find these in your Supabase project settings: https://app.supabase.com/project/_/settings/api');
    console.error('⚠️  Using hardcoded URL for development - this should be in environment variables for production');
}

// Create Supabase client
// Using service_role key gives full access (bypasses RLS)
const supabase = createClient(supabaseUrl, supabaseKey || '', {
    auth: {
        persistSession: false,
        autoRefreshToken: false
    }
});

module.exports = supabase;

