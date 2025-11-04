// Supabase Configuration
require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Supabase credentials not found!');
    console.error('Please set SUPABASE_URL and SUPABASE_ANON_KEY in your .env file');
    console.error('You can find these in your Supabase project settings: https://app.supabase.com/project/_/settings/api');
}

// Create Supabase client
const supabase = createClient(supabaseUrl || '', supabaseKey || '', {
    auth: {
        persistSession: false
    }
});

module.exports = supabase;


