# Migration Guide: JSON to Supabase

## Files Created

1. **supabase-config.js** - Supabase client configuration
2. **supabase-db.js** - Database operations (readShipments, createShipment, etc.)
3. **supabase-schema.sql** - Database schema to run in Supabase
4. **SUPABASE_SETUP.md** - Setup instructions

## Quick Start

1. **Install dependencies** (already done):
   ```bash
   npm install @supabase/supabase-js dotenv
   ```

2. **Create Supabase project** and get credentials:
   - Go to https://supabase.com
   - Create a new project
   - Get your `SUPABASE_URL` and `SUPABASE_ANON_KEY` from Settings → API

3. **Create .env file**:
   ```env
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your-anon-key
   USE_SUPABASE=true
   ```

4. **Run the SQL schema**:
   - Open Supabase SQL Editor
   - Copy contents of `supabase-schema.sql`
   - Run the script

5. **Update server.js**:
   
   Add at the top (after require statements):
   ```javascript
   // Load environment variables
   require('dotenv').config();
   
   // Database: Use Supabase if configured, otherwise use JSON files
   const USE_SUPABASE = process.env.USE_SUPABASE === 'true' || (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY);
   let db;
   
   if (USE_SUPABASE) {
       try {
           db = require('./supabase-db');
           console.log('✅ Using Supabase database');
       } catch (error) {
           console.error('❌ Failed to load Supabase:', error);
           console.log('⚠️ Falling back to JSON files');
           USE_SUPABASE = false;
       }
   }
   ```

   Replace `readShipments()` function:
   ```javascript
   async function readShipments() {
       if (USE_SUPABASE && db) {
           return await db.readShipments();
       }
       // ... existing JSON file code ...
   }
   ```

   Replace `writeShipments()` function:
   ```javascript
   async function writeShipments(shipments) {
       if (USE_SUPABASE && db) {
           console.log('⚠️ writeShipments() called - individual updates should use updateShipment()');
           return true;
       }
       // ... existing JSON file code ...
   }
   ```

   Update shipment creation (around line 734):
   ```javascript
   // Instead of: shipments.push(newShipment); await writeShipments(shipments);
   // Use:
   if (USE_SUPABASE && db) {
       const created = await db.createShipment(newShipment);
       if (!created) {
           throw new Error('Failed to create shipment in database');
       }
       res.status(201).json(created);
   } else {
       shipments.push(newShipment);
       await writeShipments(shipments);
       res.status(201).json(newShipment);
   }
   ```

   Update shipment updates (around line 992):
   ```javascript
   // Instead of: await writeShipments(shipments);
   // Use:
   if (USE_SUPABASE && db) {
       await db.updateShipment(trackingId, shipment);
   } else {
       await writeShipments(shipments);
   }
   ```

   Update shipment retrieval (around line 684):
   ```javascript
   // Instead of: const shipments = await readShipments(); const shipment = shipments.find(...)
   // Use:
   if (USE_SUPABASE && db) {
       const shipment = await db.getShipmentByTrackingId(trackingId);
       if (!shipment) {
           return res.status(404).json({ error: 'Shipment not found' });
       }
       return res.json(shipment);
   } else {
       const shipments = await readShipments();
       const shipment = shipments.find(s => s.trackingId === trackingId.toUpperCase());
       // ... rest of code ...
   }
   ```

## Testing

1. Start server: `npm start`
2. Check console for "✅ Using Supabase database" message
3. Create a test shipment
4. Verify it appears in Supabase dashboard

## Rollback

If you need to rollback to JSON files:
- Set `USE_SUPABASE=false` in `.env` or remove the env vars
- Restart the server


