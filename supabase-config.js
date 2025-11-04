// Supabase Configuration
require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');

// Get Supabase credentials from environment variables
// Fallback to hardcoded URL for development (remove in production)
const supabaseUrl = process.env.SUPABASE_URL || 'https://xkowxkwinqmeivelazwp.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY;

if (!supabaseKey) {
    console.error('❌ Supabase credentials not found!');
    console.error('Please set SUPABASE_ANON_KEY (or SUPABASE_KEY) in your .env file');
    console.error('You can find these in your Supabase project settings: https://app.supabase.com/project/_/settings/api');
    console.error('⚠️  Using hardcoded URL for development - this should be in environment variables for production');
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey || '', {
    auth: {
        persistSession: false
    }
});

module.exports = supabase;


