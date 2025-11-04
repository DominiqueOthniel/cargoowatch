# Supabase Setup Guide

This guide will help you connect your CargoWatch application to Supabase.

## Step 1: Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Fill in your project details:
   - Name: `cargowatch` (or your preferred name)
   - Database Password: Choose a strong password (save it!)
   - Region: Choose the closest region to your users
5. Click "Create new project"

## Step 2: Get Your Supabase Credentials

1. Once your project is created, go to **Settings** → **API**
2. You'll find:
   - **Project URL** (this is your `SUPABASE_URL`)
   - **anon/public key** (this is your `SUPABASE_ANON_KEY`)

## Step 3: Create the Database Schema

1. In your Supabase dashboard, go to **SQL Editor**
2. Open the file `supabase-schema.sql` from this project
3. Copy and paste the entire SQL script
4. Click "Run" to execute the schema

This will create:
- `users` table
- `shipments` table
- `chats` table
- Indexes for better performance
- Triggers for automatic `updated_at` timestamps

## Step 4: Configure Environment Variables

1. Create a `.env` file in the root directory (copy from `.env.example`)
2. Add your Supabase credentials:

```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SESSION_SECRET=your-secret-key-change-in-production
PORT=3000
```

## Step 5: Enable Supabase in Your Code

You have two options:

### Option A: Use Supabase (Recommended for Production)

Update `server.js` to use Supabase:

```javascript
// At the top of server.js, replace the imports
const db = require('./supabase-db');

// Replace readShipments() calls with db.readShipments()
// Replace writeShipments() calls with db.createShipment() or db.updateShipment()
```

### Option B: Keep JSON Files (For Development)

Keep using the JSON files for local development and switch to Supabase only in production.

## Step 6: Migrate Existing Data (Optional)

If you have existing data in `data/shipments.json`, you can migrate it:

1. Create a migration script or
2. Manually import the data through Supabase dashboard
3. Use the Supabase table editor to import JSON data

## Step 7: Test the Connection

1. Start your server: `npm start`
2. Check the console for any Supabase connection errors
3. Try creating a new shipment through the UI
4. Verify it appears in your Supabase dashboard

## Troubleshooting

### "Supabase credentials not found"
- Make sure your `.env` file exists and contains `SUPABASE_URL` and `SUPABASE_ANON_KEY`
- Restart your server after creating/modifying the `.env` file

### "relation does not exist"
- Make sure you've run the SQL schema script in Supabase SQL Editor
- Check that all tables were created successfully

### "permission denied"
- Check your Supabase Row Level Security (RLS) policies
- You may need to disable RLS for development or create appropriate policies

## Row Level Security (RLS)

By default, Supabase enables RLS. For development, you can temporarily disable it:

1. Go to **Authentication** → **Policies** in Supabase
2. Disable RLS for each table (for development only)
3. For production, create proper RLS policies based on your security needs

## Next Steps

- Set up proper authentication with Supabase Auth
- Configure Row Level Security policies
- Set up database backups
- Monitor your database usage in Supabase dashboard


