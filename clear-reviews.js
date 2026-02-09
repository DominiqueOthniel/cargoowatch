/**
 * Script pour vider tous les avis (JSON + MongoDB)
 * Usage: node clear-reviews.js
 */
require('dotenv').config();
const path = require('path');
const fs = require('fs').promises;

const DATA_DIR = path.join(__dirname, 'data');
const REVIEWS_FILE = path.join(DATA_DIR, 'reviews.json');

async function clearReviews() {
    console.log('🗑️ Clearing all reviews...');
    
    // 1. Clear JSON file
    await fs.writeFile(REVIEWS_FILE, '[]');
    console.log('✅ JSON file cleared');

    // 2. Clear MongoDB if configured
    if (process.env.MONGODB_URI) {
        try {
            const { MongoClient } = require('mongodb');
            const client = new MongoClient(process.env.MONGODB_URI);
            await client.connect();
            const db = client.db(process.env.MONGODB_DB_NAME || 'cargowatch');
            const result = await db.collection('reviews').deleteMany({});
            console.log(`✅ MongoDB: ${result.deletedCount} review(s) deleted`);
            await client.close();
        } catch (err) {
            console.error('❌ MongoDB error:', err.message);
        }
    } else {
        console.log('📄 MongoDB not configured, JSON only');
    }

    console.log('✅ Done');
}

clearReviews().catch(console.error);
