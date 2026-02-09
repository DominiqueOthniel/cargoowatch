/**
 * CargoWatch - MongoDB Database Module
 * Connexion et opérations CRUD pour MongoDB
 */
const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.MONGODB_DB_NAME || 'cargowatch';

let client = null;
let db = null;

async function connect() {
    if (!MONGODB_URI) {
        throw new Error('MONGODB_URI is not defined in environment variables');
    }
    if (client) return db;
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    db = client.db(DB_NAME);
    console.log(`✅ MongoDB connected: ${DB_NAME}`);
    return db;
}

function isConnected() {
    return db !== null;
}

function getCollection(name) {
    if (!db) throw new Error('MongoDB not connected. Call connect() first.');
    return db.collection(name);
}

async function disconnect() {
    if (client) {
        await client.close();
        client = null;
        db = null;
        console.log('MongoDB disconnected');
    }
}

module.exports = {
    connect,
    disconnect,
    isConnected,
    getCollection,
    get db() { return db; }
};
