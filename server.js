// Load environment variables
require('dotenv').config();

const dbModule = require('./db');
const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const fsSync = require('fs');
const cors = require('cors');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const http = require('http');
const https = require('https');
const { Server } = require('socket.io');
const multer = require('multer');
const PDFDocument = require('pdfkit');
const zipcodes = require('zipcodes');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');

// Database: JSON ou MongoDB selon MONGODB_URI
let USE_MONGO = false;

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // Allow all origins for now
        methods: ['GET', 'POST'],
        credentials: true
    }
});

const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const SHIPMENTS_FILE = path.join(DATA_DIR, 'shipments.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const CHATS_FILE = path.join(DATA_DIR, 'chats.json');
const REVIEWS_FILE = path.join(DATA_DIR, 'reviews.json');
const RECEIPTS_DIR = path.join(__dirname, 'public', 'receipts');
const SESSION_SECRET = process.env.SESSION_SECRET || 'cargowatch-secret-key-change-in-production';

const US_STATE_NAME_TO_CODE = {
    'alabama': 'AL',
    'alaska': 'AK',
    'arizona': 'AZ',
    'arkansas': 'AR',
    'california': 'CA',
    'colorado': 'CO',
    'connecticut': 'CT',
    'delaware': 'DE',
    'florida': 'FL',
    'georgia': 'GA',
    'hawaii': 'HI',
    'idaho': 'ID',
    'illinois': 'IL',
    'indiana': 'IN',
    'iowa': 'IA',
    'kansas': 'KS',
    'kentucky': 'KY',
    'louisiana': 'LA',
    'maine': 'ME',
    'maryland': 'MD',
    'massachusetts': 'MA',
    'michigan': 'MI',
    'minnesota': 'MN',
    'mississippi': 'MS',
    'missouri': 'MO',
    'montana': 'MT',
    'nebraska': 'NE',
    'nevada': 'NV',
    'new hampshire': 'NH',
    'new jersey': 'NJ',
    'new mexico': 'NM',
    'new york': 'NY',
    'north carolina': 'NC',
    'north dakota': 'ND',
    'ohio': 'OH',
    'oklahoma': 'OK',
    'oregon': 'OR',
    'pennsylvania': 'PA',
    'rhode island': 'RI',
    'south carolina': 'SC',
    'south dakota': 'SD',
    'tennessee': 'TN',
    'texas': 'TX',
    'utah': 'UT',
    'vermont': 'VT',
    'virginia': 'VA',
    'washington': 'WA',
    'west virginia': 'WV',
    'wisconsin': 'WI',
    'wyoming': 'WY',
    'district of columbia': 'DC',
    'washington dc': 'DC',
    'd.c.': 'DC',
    'dc': 'DC',
    'puerto rico': 'PR',
    'guam': 'GU',
    'american samoa': 'AS',
    'u.s. virgin islands': 'VI',
    'northern mariana islands': 'MP'
};

const CITY_COORDINATE_CACHE = new Map();
const NEAREST_CITY_CACHE = new Map();

const TRUCK_SPEED_MPH = 55;
const MIN_MILES_PER_MINUTE = 1;
const DAILY_DRIVING_HOURS = 11;
const HANDLING_DELAY_HOURS = 4;

// Configure multer for receipt uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Ensure directory exists synchronously
        fs.mkdir(RECEIPTS_DIR, { recursive: true })
            .then(() => cb(null, RECEIPTS_DIR))
            .catch(err => cb(err));
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, `receipt-${uniqueSuffix}${ext}`);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only images and PDF files are allowed'));
        }
    }
});

// Middleware
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Configuration des sessions
app.use(session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false,
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000
    }
}));

// CrÃ©er le dossier data s'il n'existe pas
async function ensureDataDir() {
    try {
        await fs.mkdir(DATA_DIR, { recursive: true });
        try {
            await fs.access(SHIPMENTS_FILE);
        } catch {
            await fs.writeFile(SHIPMENTS_FILE, JSON.stringify([], null, 2));
        }
        try {
            await fs.access(USERS_FILE);
        } catch {
            const defaultAdmin = {
                id: uuidv4(),
                username: 'admin',
                email: 'admin@cargowatch.com',
                password: await bcrypt.hash('admin123', 10),
                role: 'admin',
                createdAt: new Date().toISOString()
            };
            await fs.writeFile(USERS_FILE, JSON.stringify([defaultAdmin], null, 2));
            console.log('âœ… Default admin created: username=admin, password=admin123');
        }
        try {
            await fs.access(CHATS_FILE);
        } catch {
            await fs.writeFile(CHATS_FILE, JSON.stringify([], null, 2));
        }
        // Ensure receipts directory exists
        await fs.mkdir(RECEIPTS_DIR, { recursive: true });
    } catch (error) {
        console.error('Error creating data directory:', error);
    }
}

// Fonctions utilitaires - JSON ou MongoDB
async function readUsers() {
    if (USE_MONGO) {
        try {
            const col = dbModule.getCollection('users');
            const list = await col.find({}).toArray();
            return list.map(doc => { const { _id, ...rest } = doc; return rest; });
        } catch (e) { console.error('Error reading users (Mongo):', e); return []; }
    }
    try {
        const data = await fs.readFile(USERS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading users:', error);
        return [];
    }
}

async function writeUsers(users) {
    if (USE_MONGO) {
        try {
            const col = dbModule.getCollection('users');
            await col.deleteMany({});
            if (users.length) await col.insertMany(users);
            return true;
        } catch (e) { console.error('Error writing users (Mongo):', e); return false; }
    }
    try {
        await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
        return true;
    } catch (error) {
        console.error('Error writing users:', error);
        return false;
    }
}

async function findUserByUsername(username) {
    const users = await readUsers();
    return users.find(u => u.username === username || u.email === username) || null;
}

async function findUserByEmail(email) {
    const users = await readUsers();
    return users.find(u => u.email === email) || null;
}

async function readShipments() {
    if (USE_MONGO) {
        try {
            const col = dbModule.getCollection('shipments');
            const list = await col.find({}).toArray();
            return list.map(doc => { const { _id, ...rest } = doc; return rest; });
        } catch (e) { console.error('Error reading shipments (Mongo):', e); return []; }
    }
    try {
        const data = await fs.readFile(SHIPMENTS_FILE, 'utf8');
        const shipments = JSON.parse(data);
        if (!Array.isArray(shipments)) {
            console.error('⚠️ Shipments file does not contain an array!');
            return [];
        }
        return shipments;
    } catch (error) {
        console.error('❌ Error reading shipments:', error);
        if (error.code === 'ENOENT') {
            console.log('📝 Shipments file does not exist, creating empty array...');
            await writeShipments([]);
            return [];
        }
        return [];
    }
}

async function writeShipments(shipments) {
    if (USE_MONGO) {
        try {
            const col = dbModule.getCollection('shipments');
            await col.deleteMany({});
            if (shipments.length) await col.insertMany(shipments);
            return true;
        } catch (e) { console.error('Error writing shipments (Mongo):', e); return false; }
    }
    try {
        await fs.writeFile(SHIPMENTS_FILE, JSON.stringify(shipments, null, 2));
        console.log(`💾 Written ${shipments.length} shipment(s) to ${SHIPMENTS_FILE}`);
        return true;
    } catch (error) {
        console.error('❌ Error writing shipments:', error);
        console.error('Error stack:', error.stack);
        return false;
    }
}

async function readChats() {
    if (USE_MONGO) {
        try {
            const col = dbModule.getCollection('chats');
            const list = await col.find({}).toArray();
            return list.map(doc => { const { _id, ...rest } = doc; return rest; });
        } catch (e) { console.error('Error reading chats (Mongo):', e); return []; }
    }
    try {
        const data = await fs.readFile(CHATS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading chats:', error);
        return [];
    }
}

async function writeChats(chats) {
    if (USE_MONGO) {
        try {
            const col = dbModule.getCollection('chats');
            await col.deleteMany({});
            if (chats.length) await col.insertMany(chats);
            return true;
        } catch (e) { console.error('Error writing chats (Mongo):', e); return false; }
    }
    try {
        await fs.writeFile(CHATS_FILE, JSON.stringify(chats, null, 2));
        return true;
    } catch (error) {
        console.error('Error writing chats:', error);
        return false;
    }
}

async function readReviews() {
    if (USE_MONGO) {
        try {
            const col = dbModule.getCollection('reviews');
            const list = await col.find({}).toArray();
            return list.map(doc => { const { _id, ...rest } = doc; return rest; });
        } catch (e) { console.error('Error reading reviews (Mongo):', e); return []; }
    }
    try {
        const data = await fs.readFile(REVIEWS_FILE, 'utf8');
        const reviews = JSON.parse(data);
        if (!Array.isArray(reviews)) return [];
        return reviews;
    } catch (error) {
        console.error('Error reading reviews:', error);
        return [];
    }
}

async function writeReviews(reviews) {
    if (USE_MONGO) {
        try {
            const col = dbModule.getCollection('reviews');
            await col.deleteMany({});
            if (reviews.length) await col.insertMany(reviews);
            return true;
        } catch (e) { console.error('Error writing reviews (Mongo):', e); return false; }
    }
    try {
        await fs.writeFile(REVIEWS_FILE, JSON.stringify(reviews, null, 2));
        console.log(`💾 Written ${reviews.length} review(s) to ${REVIEWS_FILE}`);
        return true;
    } catch (error) {
        console.error('Error writing reviews:', error);
        return false;
    }
}

// Middleware d'authentification
function requireAuth(req, res, next) {
    if (req.session && req.session.userId) {
        return next();
    }
    res.status(401).json({ error: 'Unauthorized', message: 'Please login to access this resource' });
}

function requireAdmin(req, res, next) {
    if (req.session && req.session.role === 'admin') {
        return next();
    }
    res.status(403).json({ error: 'Forbidden', message: 'Admin access required' });
}

function generateTrackingId() {
    const prefix = 'CW';
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.random().toString(36).substr(2, 8).toUpperCase();
    return `${prefix}${year}${month}${day}${random}`;
}

function toStateCode(value) {
    if (!value) return null;
    const trimmed = value.trim();
    if (!trimmed) return null;
    if (trimmed.length === 2 && /^[A-Za-z]{2}$/.test(trimmed)) {
        return trimmed.toUpperCase();
    }
    const normalized = trimmed.toLowerCase();
    return US_STATE_NAME_TO_CODE[normalized] || null;
}

function parseLocationInput(location) {
    if (!location) {
        return { city: '', state: '', country: '', zipCode: '' };
    }

    if (typeof location === 'object') {
        return {
            city: location.city || '',
            state: location.state || '',
            country: location.country || '',
            zipCode: location.zipCode || location.postalCode || location.zip || ''
        };
    }

    const trimmed = location.trim();
    if (!trimmed) {
        return { city: '', state: '', country: '', zipCode: '' };
    }

    const result = { city: '', state: '', country: '', zipCode: '' };

    const parts = trimmed.split(',').map(part => part.trim()).filter(Boolean);
    if (parts.length >= 3) {
        result.city = parts[0];
        result.state = parts[1];
        result.country = parts[2];
    } else if (parts.length === 2) {
        result.city = parts[0];
        result.state = parts[1];
    } else if (parts.length === 1) {
        result.city = parts[0];
    }

    // Force Cameroon as default
    if (!result.country) {
        result.country = 'CM';
    }

    const stateSegments = result.state.split(/\s+/).filter(Boolean);
    if (stateSegments.length > 1) {
        const lastSegment = stateSegments[stateSegments.length - 1];
        if (/^\d{5}(?:-\d{4})?$/.test(lastSegment)) {
            result.zipCode = lastSegment;
            stateSegments.pop();
            result.state = stateSegments.join(' ');
        }
    }

    if (!result.zipCode) {
        const zipMatch = trimmed.match(/\b\d{5}(?:-\d{4})?\b/);
        if (zipMatch) {
            result.zipCode = zipMatch[0];
        }
    }

    return result;
}

// Fonction pour obtenir les coordonnées des villes avec couverture US complète
function getCityCoordinates(location) {
    if (!location) return null;

    const { city, state, country, zipCode } = parseLocationInput(location);
    const originalInput = typeof location === 'string'
        ? location
        : [city, state, country].filter(Boolean).join(', ');

    if (!city && !originalInput) {
        return null;
    }

    // Force Cameroon only
    const isCM = !country || /^(cm|cameroon|cameroun)$/i.test(country.trim());
    const isUS = false; // Disabled - Cameroon only

    if (isUS) {
        const usableZip = zipCode ? String(zipCode).trim().slice(0, 5) : '';
        if (usableZip && /^\d{5}$/.test(usableZip)) {
            const zipRecord = zipcodes.lookup(usableZip);
            if (zipRecord?.latitude && zipRecord?.longitude) {
                const coords = {
                    lat: Number(zipRecord.latitude),
                    lng: Number(zipRecord.longitude)
                };
                if (!Number.isNaN(coords.lat) && !Number.isNaN(coords.lng)) {
                    const cacheKey = `${zipRecord.city.toLowerCase()},${zipRecord.state}`;
                    CITY_COORDINATE_CACHE.set(cacheKey, coords);
                    return coords;
                }
            }
        }

        const stateCode = toStateCode(state);
        if (stateCode && city) {
            const cacheKey = `${city.toLowerCase()},${stateCode}`;
            if (CITY_COORDINATE_CACHE.has(cacheKey)) {
                return CITY_COORDINATE_CACHE.get(cacheKey);
            }
            try {
                const matches = zipcodes.lookupByName(city, stateCode) || [];
                if (matches.length > 0) {
                    const match = matches[0];
                    if (match?.latitude && match?.longitude) {
                        const coords = {
                            lat: Number(match.latitude),
                            lng: Number(match.longitude)
                        };
                        if (!Number.isNaN(coords.lat) && !Number.isNaN(coords.lng)) {
                            CITY_COORDINATE_CACHE.set(cacheKey, coords);
                            return coords;
                        }
                    }
                }
            } catch (error) {
                console.warn(`Warning: unable to resolve coordinates for ${city}, ${stateCode}:`, error.message);
            }
        }
    }

    const fallbackCityCoords = {
        // Cameroonian Cities / Villes Camerounaises - Liste complète
        // Principales villes (plus de 100 000 habitants)
        'Yaoundé': { lat: 3.8480, lng: 11.5021 },
        'Yaounde': { lat: 3.8480, lng: 11.5021 }, // Without accent
        'Douala': { lat: 4.0511, lng: 9.7679 },
        'Garoua': { lat: 9.3000, lng: 13.4000 },
        'Bamenda': { lat: 6.1167, lng: 10.1667 },
        'Bafoussam': { lat: 5.4776, lng: 10.4176 },
        'Maroua': { lat: 10.5956, lng: 14.3247 },
        'Nkongsamba': { lat: 4.9500, lng: 9.9333 },
        'Ngaoundéré': { lat: 7.3167, lng: 13.5833 },
        'Ngaoundere': { lat: 7.3167, lng: 13.5833 },
        'Bertoua': { lat: 4.5833, lng: 14.0833 },
        'Edéa': { lat: 3.8000, lng: 10.1333 },
        'Edea': { lat: 3.8000, lng: 10.1333 },
        'Loum': { lat: 4.7167, lng: 9.7333 },
        'Kumba': { lat: 4.6333, lng: 9.4500 },
        'Kumbo': { lat: 6.2000, lng: 10.6667 },
        'Foumban': { lat: 5.7167, lng: 10.9167 },
        'Mbouda': { lat: 5.6333, lng: 10.2500 },
        'Dschang': { lat: 5.4500, lng: 10.0667 },
        'Limbé': { lat: 4.0242, lng: 9.2068 },
        'Limbe': { lat: 4.0242, lng: 9.2068 },
        'Ebolowa': { lat: 2.9333, lng: 11.1500 },
        'Kousséri': { lat: 12.0833, lng: 15.0333 },
        'Kousseri': { lat: 12.0833, lng: 15.0333 },
        'Guider': { lat: 9.9333, lng: 13.9500 },
        'Meiganga': { lat: 6.5167, lng: 14.3000 },
        'Yagoua': { lat: 10.3500, lng: 15.2333 },
        'Mbalmayo': { lat: 3.5167, lng: 11.5000 },
        'Bafang': { lat: 5.1500, lng: 10.1833 },
        'Tiko': { lat: 4.0833, lng: 9.3667 },
        'Bafia': { lat: 4.7500, lng: 11.2333 },
        'Wum': { lat: 6.3833, lng: 10.0667 },
        'Kribi': { lat: 2.9373, lng: 9.9077 },
        'Buea': { lat: 4.1534, lng: 9.2426 },
        'Sangmélima': { lat: 2.9333, lng: 11.9833 },
        'Sangmelima': { lat: 2.9333, lng: 11.9833 },
        'Foumbot': { lat: 5.5000, lng: 10.6333 },
        'Bangangté': { lat: 5.1500, lng: 10.5167 },
        'Bangangte': { lat: 5.1500, lng: 10.5167 },
        'Batouri': { lat: 4.4333, lng: 14.3667 },
        'Banyo': { lat: 6.7500, lng: 11.8167 },
        'Nkambé': { lat: 6.6167, lng: 10.8333 },
        'Nkambe': { lat: 6.6167, lng: 10.8333 },
        'Bali': { lat: 5.8833, lng: 10.0167 },
        'Mbanga': { lat: 4.5000, lng: 9.5667 },
        'Mokolo': { lat: 10.7333, lng: 13.8000 },
        'Melong': { lat: 5.1167, lng: 9.9500 },
        'Manjo': { lat: 4.8333, lng: 9.8167 },
        'Garoua-Boulaï': { lat: 5.8833, lng: 14.5500 },
        'Garoua-Boulai': { lat: 5.8833, lng: 14.5500 },
        'Mora': { lat: 11.0500, lng: 14.1333 },
        'Kaélé': { lat: 10.1000, lng: 14.4500 },
        'Kaele': { lat: 10.1000, lng: 14.4500 },
        'Tibati': { lat: 6.4667, lng: 12.6333 },
        'Ndop': { lat: 6.2000, lng: 10.4833 },
        'Akonolinga': { lat: 3.7667, lng: 12.2500 },
        'Eséka': { lat: 3.6500, lng: 10.7667 },
        'Eseka': { lat: 3.6500, lng: 10.7667 },
        'Mamfé': { lat: 5.7500, lng: 9.2833 },
        'Mamfe': { lat: 5.7500, lng: 9.2833 },
        'Obala': { lat: 4.1667, lng: 11.5333 },
        'Muyuka': { lat: 4.2833, lng: 9.4167 },
        'Nanga-Eboko': { lat: 4.6833, lng: 12.3667 },
        'Nanga Eboko': { lat: 4.6833, lng: 12.3667 },
        'Abong-Mbang': { lat: 3.9833, lng: 13.1833 },
        'Abong Mbang': { lat: 3.9833, lng: 13.1833 },
        'Fundong': { lat: 6.2500, lng: 10.2667 },
        'Nkoteng': { lat: 4.5167, lng: 12.0333 },
        'Fontem': { lat: 5.4667, lng: 9.8833 },
        'Mbandjock': { lat: 4.4500, lng: 11.9000 },
        'Touboro': { lat: 7.7833, lng: 15.3667 },
        'Ngaoundal': { lat: 6.4500, lng: 13.7667 },
        'Yokadouma': { lat: 3.5167, lng: 15.0500 },
        'Pitoa': { lat: 9.3833, lng: 13.5333 },
        'Tombel': { lat: 4.5833, lng: 9.6667 },
        'Kékem': { lat: 5.5500, lng: 10.1167 },
        'Kekem': { lat: 5.5500, lng: 10.1167 },
        'Magba': { lat: 5.9167, lng: 10.6167 },
        'Bélabo': { lat: 4.9333, lng: 13.3000 },
        'Belabo': { lat: 4.9333, lng: 13.3000 },
        'Tonga': { lat: 4.9667, lng: 10.7000 },
        'Maga': { lat: 10.8500, lng: 14.9333 },
        'Koutaba': { lat: 5.6500, lng: 10.7500 },
        'Blangoua': { lat: 12.2333, lng: 14.5167 },
        'Guidiguis': { lat: 9.9333, lng: 13.9500 },
        'Bogo': { lat: 10.7333, lng: 14.6167 },
        'Batibo': { lat: 6.0833, lng: 10.0167 },
        'Yabassi': { lat: 4.4500, lng: 9.9667 },
        'Figuil': { lat: 9.7667, lng: 13.9667 },
        'Makénéné': { lat: 4.8333, lng: 11.2167 },
        'Makenene': { lat: 4.8333, lng: 11.2167 },
        'Gazawa': { lat: 10.5833, lng: 14.2000 },
        'Tcholliré': { lat: 8.4000, lng: 14.1667 },
        'Tchollire': { lat: 8.4000, lng: 14.1667 },
        // Autres villes importantes
        'Buea Town': { lat: 4.1534, lng: 9.2426 },
        'Bamessing': { lat: 6.0333, lng: 10.1500 },
        'Bamessing': { lat: 6.0333, lng: 10.1500 },
        'Bamunka': { lat: 5.9167, lng: 10.5833 },
        'Bana': { lat: 5.1500, lng: 10.2667 },
        'Bandjoun': { lat: 5.3500, lng: 10.4167 },
        'Bangang': { lat: 5.1333, lng: 10.5167 },
        'Bansoa': { lat: 5.4500, lng: 10.3167 },
        'Bazou': { lat: 5.0667, lng: 10.4667 },
        'Bekondo': { lat: 4.6833, lng: 9.3167 },
        'Bonabéri': { lat: 4.0833, lng: 9.6833 },
        'Bonaberi': { lat: 4.0833, lng: 9.6833 },
        'Buéa': { lat: 4.1534, lng: 9.2426 },
        'Campo': { lat: 2.3667, lng: 9.8167 },
        'Dibombari': { lat: 4.1833, lng: 9.6500 },
        'Dizangué': { lat: 3.7667, lng: 9.9833 },
        'Dizangue': { lat: 3.7667, lng: 9.9833 },
        'Djohong': { lat: 6.8333, lng: 14.7000 },
        'Doumé': { lat: 4.2333, lng: 13.4500 },
        'Doume': { lat: 4.2333, lng: 13.4500 },
        'Dschang': { lat: 5.4500, lng: 10.0667 },
        'Fang': { lat: 5.7000, lng: 10.8833 },
        'Fokoué': { lat: 5.5833, lng: 10.6000 },
        'Fokoue': { lat: 5.5833, lng: 10.6000 },
        'Foumbot': { lat: 5.5000, lng: 10.6333 },
        'Galim': { lat: 6.4000, lng: 11.4167 },
        'Garoua': { lat: 9.3000, lng: 13.4000 },
        'Gashiga': { lat: 10.5167, lng: 13.9833 },
        'Goulfey': { lat: 12.0833, lng: 14.9833 },
        'Guider': { lat: 9.9333, lng: 13.9500 },
        'Guider': { lat: 9.9333, lng: 13.9500 },
        'Idabato': { lat: 4.9000, lng: 8.9000 },
        'Idenau': { lat: 4.2500, lng: 8.9833 },
        'Kaele': { lat: 10.1000, lng: 14.4500 },
        'Kontcha': { lat: 7.9833, lng: 12.2333 },
        'Kribi': { lat: 2.9373, lng: 9.9077 },
        'Kumbo': { lat: 6.2000, lng: 10.6667 },
        'Lagdo': { lat: 9.0500, lng: 13.6667 },
        'Lolodorf': { lat: 3.2333, lng: 10.7333 },
        'Mamfe': { lat: 5.7500, lng: 9.2833 },
        'Mbankomo': { lat: 3.7833, lng: 11.3833 },
        'Mbandjock': { lat: 4.4500, lng: 11.9000 },
        'Mbalmayo': { lat: 3.5167, lng: 11.5000 },
        'Mbanga': { lat: 4.5000, lng: 9.5667 },
        'Mbouda': { lat: 5.6333, lng: 10.2500 },
        'Melong': { lat: 5.1167, lng: 9.9500 },
        'Mfou': { lat: 3.8667, lng: 11.6333 },
        'Mindif': { lat: 10.4000, lng: 14.4333 },
        'Minta': { lat: 4.5833, lng: 12.8000 },
        'Mokolo': { lat: 10.7333, lng: 13.8000 },
        'Mora': { lat: 11.0500, lng: 14.1333 },
        'Mundemba': { lat: 4.9500, lng: 8.8667 },
        'Mutengene': { lat: 4.1000, lng: 9.3167 },
        'Nanga-Eboko': { lat: 4.6833, lng: 12.3667 },
        'Ndelele': { lat: 4.0333, lng: 14.9333 },
        'Ndikiniméki': { lat: 4.7667, lng: 10.8333 },
        'Ndikinimeki': { lat: 4.7667, lng: 10.8333 },
        'Ndom': { lat: 4.5000, lng: 9.8167 },
        'Ngambe': { lat: 4.2333, lng: 10.6167 },
        'Ngomedzap': { lat: 3.2500, lng: 11.2167 },
        'Ngou': { lat: 5.2000, lng: 10.3833 },
        'Nguti': { lat: 5.3167, lng: 9.4167 },
        'Nkambe': { lat: 6.6167, lng: 10.8333 },
        'Nkongsamba': { lat: 4.9500, lng: 9.9333 },
        'Nkoteng': { lat: 4.5167, lng: 12.0333 },
        'Ntui': { lat: 4.4500, lng: 11.6333 },
        'Nyambaka': { lat: 7.2000, lng: 13.5833 },
        'Oku': { lat: 6.2000, lng: 10.4667 },
        'Poli': { lat: 8.4833, lng: 13.2500 },
        'Pouma': { lat: 3.5167, lng: 10.1667 },
        'Rey Bouba': { lat: 8.6667, lng: 14.1833 },
        'Saa': { lat: 4.3667, lng: 11.4500 },
        'Sangmélima': { lat: 2.9333, lng: 11.9833 },
        'Tcholliré': { lat: 8.4000, lng: 14.1667 },
        'Tibati': { lat: 6.4667, lng: 12.6333 },
        'Tiko': { lat: 4.0833, lng: 9.3667 },
        'Tombel': { lat: 4.5833, lng: 9.6667 },
        'Tonga': { lat: 4.9667, lng: 10.7000 },
        'Touboro': { lat: 7.7833, lng: 15.3667 },
        'Wum': { lat: 6.3833, lng: 10.0667 },
        'Yabassi': { lat: 4.4500, lng: 9.9667 },
        'Yagoua': { lat: 10.3500, lng: 15.2333 },
        'Yokadouma': { lat: 3.5167, lng: 15.0500 },
        'Zou': { lat: 4.8167, lng: 11.1333 }
    };

    const normalizedInput = originalInput ? originalInput.trim() : '';

    if (normalizedInput.includes(',')) {
        const [firstPart] = normalizedInput.split(',').map(part => part.trim()).filter(Boolean);
        if (firstPart) {
            for (const [key, coords] of Object.entries(fallbackCityCoords)) {
                if (firstPart.toLowerCase() === key.toLowerCase()) {
                    return coords;
                }
            }
        }
    }

    const compareValues = [
        normalizedInput,
        city
    ].filter(Boolean);

    for (const value of compareValues) {
        for (const [key, coords] of Object.entries(fallbackCityCoords)) {
            if (value.trim().toLowerCase() === key.toLowerCase()) {
                return coords;
            }
        }
    }

    return null;
}

function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
    const R = 3959;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

function findNearestCity(lat, lng) {
    if (lat == null || lng == null) return 'In Transit';
    const cacheKey = `${lat.toFixed(3)},${lng.toFixed(3)}`;
    if (NEAREST_CITY_CACHE.has(cacheKey)) {
        return NEAREST_CITY_CACHE.get(cacheKey);
    }
    const match = zipcodes.lookupByCoords(lat, lng);
    if (match?.city && match?.state) {
        const label = `${match.city}, ${match.state}`;
        NEAREST_CITY_CACHE.set(cacheKey, label);
        return label;
    }
    return 'In Transit';
}

// Cache pour les routes calculées (évite de recalculer à chaque fois)
const routeCache = new Map();

// Fonction pour obtenir la route depuis OSRM (Open Source Routing Machine)
function getRouteFromOSRM(originLat, originLng, destLat, destLng) {
    const cacheKey = `${originLat},${originLng}-${destLat},${destLng}`;
    
    // Vérifier le cache
    if (routeCache.has(cacheKey)) {
        return Promise.resolve(routeCache.get(cacheKey));
    }
    
    return new Promise((resolve) => {
        try {
            // Utiliser l'API publique OSRM (gratuite, sans clé API)
            // Format: /route/v1/driving/{coordinates}?overview=full&geometries=geojson
            const url = `https://router.project-osrm.org/route/v1/driving/${originLng},${originLat};${destLng},${destLat}?overview=full&geometries=geojson&alternatives=false`;
            
            console.log(`🛣️ Fetching route from OSRM: ${originLat},${originLng} → ${destLat},${destLng}`);
            
            https.get(url, (res) => {
                let data = '';
                
                res.on('data', (chunk) => {
                    data += chunk;
                });
                
                res.on('end', () => {
                    try {
                        const jsonData = JSON.parse(data);
                        
                        if (jsonData.code !== 'Ok' || !jsonData.routes || jsonData.routes.length === 0) {
                            console.warn('⚠️ OSRM returned no route, using direct line');
                            resolve(null);
                            return;
                        }
                        
                        const route = jsonData.routes[0];
                        const routeData = {
                            geometry: route.geometry.coordinates.map(coord => [coord[1], coord[0]]), // Convertir [lng, lat] en [lat, lng]
                            distance: route.distance / 1000, // Convertir mètres en kilomètres
                            duration: route.duration, // en secondes
                            distanceMiles: (route.distance / 1000) * 0.621371 // Convertir en miles
                        };
                        
                        // Mettre en cache
                        routeCache.set(cacheKey, routeData);
                        console.log(`✅ Route calculated: ${routeData.distanceMiles.toFixed(2)} miles, ${routeData.geometry.length} points`);
                        
                        resolve(routeData);
                    } catch (parseError) {
                        console.error('❌ Error parsing OSRM response:', parseError.message);
                        resolve(null);
                    }
                });
            }).on('error', (error) => {
                console.error('❌ Error fetching route from OSRM:', error.message);
                // En cas d'erreur, retourner null pour utiliser la ligne droite
                resolve(null);
            });
        } catch (error) {
            console.error('❌ Error in getRouteFromOSRM:', error.message);
            resolve(null);
        }
    });
}

// Fonction pour trouver le point le plus proche sur la route selon le pourcentage de progression
function getPointOnRoute(routeGeometry, progress) {
    if (!routeGeometry || routeGeometry.length === 0) {
        return null;
    }
    
    // Clamp progress entre 0 et 1
    progress = Math.max(0, Math.min(1, progress));
    
    // Calculer l'index exact sur la route
    const exactIndex = progress * (routeGeometry.length - 1);
    const index = Math.floor(exactIndex);
    const fraction = exactIndex - index;
    
    // Si on est à la fin de la route
    if (index >= routeGeometry.length - 1) {
        return routeGeometry[routeGeometry.length - 1];
    }
    
    // Interpoler entre deux points consécutifs
    const point1 = routeGeometry[index];
    const point2 = routeGeometry[index + 1];
    
    const lat = point1[0] + (point2[0] - point1[0]) * fraction;
    const lng = point1[1] + (point2[1] - point1[1]) * fraction;
    
    return [lat, lng];
}

async function calculateAutomaticProgression(shipment) {
    if (!shipment.autoProgress?.enabled || shipment.status === 'delivered') {
        return null;
    }
    if (!shipment.sender?.address?.lat || !shipment.recipient?.address?.lat) {
        console.log(`⚠️ Missing coordinates for ${shipment.trackingId}: sender=${!!shipment.sender?.address?.lat}, recipient=${!!shipment.recipient?.address?.lat}`);
        return null;
    }

    const originLat = shipment.sender.address.lat;
    const originLng = shipment.sender.address.lng;
    const destLat = shipment.recipient.address.lat;
    const destLng = shipment.recipient.address.lng;
    
    // Obtenir ou utiliser la route en cache
    let routeGeometry = shipment.routeGeometry;
    let routeDistanceMiles = shipment.routeDistanceMiles;
    
    // Si pas de route stockée, la calculer
    if (!routeGeometry) {
        const routeData = await getRouteFromOSRM(originLat, originLng, destLat, destLng);
        if (routeData) {
            routeGeometry = routeData.geometry;
            routeDistanceMiles = routeData.distanceMiles;
            // Stocker dans le shipment pour éviter de recalculer
            shipment.routeGeometry = routeGeometry;
            shipment.routeDistanceMiles = routeDistanceMiles;
        }
    }

    let startedAt = shipment.autoProgress.startedAt
        ? new Date(shipment.autoProgress.startedAt)
        : shipment.createdAt
        ? new Date(shipment.createdAt)
        : null;

    if (!startedAt && shipment.events?.length) {
        const firstActiveEvent = shipment.events.find(e => e.status && e.status !== 'pending');
        if (firstActiveEvent?.timestamp) {
            startedAt = new Date(firstActiveEvent.timestamp);
        }
    }

    if (!startedAt) {
        return null;
    }

    const now = new Date();
    let elapsedHours = (now - startedAt) / (1000 * 60 * 60);

    if (elapsedHours < 0) {
        return null;
    }

    let pausedDurationHours = (shipment.autoProgress.pausedDuration || 0) / (1000 * 60 * 60);
    if (shipment.autoProgress.paused && shipment.autoProgress.pausedAt) {
        const pauseStart = new Date(shipment.autoProgress.pausedAt);
        pausedDurationHours += Math.max(0, (now - pauseStart) / (1000 * 60 * 60));
    }

    const effectiveElapsedHours = Math.max(0, elapsedHours - pausedDurationHours);
    if (effectiveElapsedHours <= HANDLING_DELAY_HOURS) {
        // Au lieu de retourner progress: 0, calculer une progression minimale basée sur le temps
        const minProgress = Math.min(0.05, effectiveElapsedHours / HANDLING_DELAY_HOURS * 0.05);
        
        // Utiliser la route réelle si disponible
        let lat, lng;
        if (routeGeometry && routeGeometry.length > 0) {
            const pointOnRoute = getPointOnRoute(routeGeometry, minProgress);
            if (pointOnRoute) {
                lat = pointOnRoute[0];
                lng = pointOnRoute[1];
            } else {
                lat = originLat + (destLat - originLat) * minProgress;
                lng = originLng + (destLng - originLng) * minProgress;
            }
        } else {
            lat = originLat + (destLat - originLat) * minProgress;
            lng = originLng + (destLng - originLng) * minProgress;
        }
        
        const nearestCity = findNearestCity(lat, lng);
        return {
            lat,
            lng,
            city: nearestCity,
            progress: minProgress
        };
    }

    const drivingWindowHours = effectiveElapsedHours - HANDLING_DELAY_HOURS;
    const fullDays = Math.floor(drivingWindowHours / 24);
    const remainderHours = drivingWindowHours - fullDays * 24;
    const drivingHours = fullDays * DAILY_DRIVING_HOURS + Math.min(DAILY_DRIVING_HOURS, remainderHours);

    // Utiliser la distance de la route si disponible, sinon distance directe
    const totalDistanceMiles = routeDistanceMiles || calculateHaversineDistance(originLat, originLng, destLat, destLng);
    if (!totalDistanceMiles || Number.isNaN(totalDistanceMiles)) {
        return null;
    }

    const drivingHoursRequired = totalDistanceMiles / TRUCK_SPEED_MPH;
    if (!drivingHoursRequired || Number.isNaN(drivingHoursRequired)) {
        return null;
    }

    const defaultProgress = Math.min(1, Math.max(0, drivingHours / drivingHoursRequired));
    const elapsedMinutesSinceStart = Math.max(0, drivingWindowHours * 60);
    const minProgressFromSpeed = totalDistanceMiles > 0
        ? Math.min(1, (elapsedMinutesSinceStart * MIN_MILES_PER_MINUTE) / totalDistanceMiles)
        : 0;
    const progress = Math.min(1, Math.max(defaultProgress, minProgressFromSpeed));

    if (progress >= 1) {
        return {
            lat: destLat,
            lng: destLng,
            city: shipment.recipient?.address?.city || 'Destination',
            progress: 1
        };
    }

    // Utiliser la route réelle si disponible, sinon ligne droite
    let lat, lng;
    if (routeGeometry && routeGeometry.length > 0) {
        const pointOnRoute = getPointOnRoute(routeGeometry, progress);
        if (pointOnRoute) {
            lat = pointOnRoute[0];
            lng = pointOnRoute[1];
        } else {
            // Fallback sur ligne droite
            lat = originLat + (destLat - originLat) * progress;
            lng = originLng + (destLng - originLng) * progress;
        }
    } else {
        // Ligne droite si pas de route disponible
        lat = originLat + (destLat - originLat) * progress;
        lng = originLng + (destLng - originLng) * progress;
    }
    
    const nearestCity = findNearestCity(lat, lng);

    return { lat, lng, city: nearestCity, progress };
}

// ==================== API ROUTES ====================

// Swagger UI - Documentation API
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'CargoWatch API Docs'
}));

// GET /api
app.get('/api', (req, res) => {
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.json({
        name: 'CargoWatch API',
        version: '1.0.0',
        description: 'Professional shipment tracking system API',
        docs: `${baseUrl}/api-docs`,
        endpoints: {
            public: {
                'GET /api': 'API information',
                'GET /api/stats': 'Get global statistics',
                'GET /api/shipments/recent': 'Get recent shipments',
                'GET /api/shipments/:trackingId': 'Get shipment details by tracking ID'
            },
            authenticated: {
                'GET /api/auth/me': 'Get current user info',
                'POST /api/auth/login': 'Admin Login',
                'POST /api/auth/logout': 'Logout'
            },
            admin: {
                'GET /api/shipments': 'List all shipments',
                'PUT /api/shipments/:trackingId/status': 'Update shipment status',
                'PUT /api/shipments/:trackingId/pause': 'Pause/Resume automatic progression',
                'POST /api/shipments/:trackingId/receipt': 'Upload shipment receipt (image or PDF)'
            }
        }
    });
});

// Admin auth routes only (user login removed)
app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }
        const user = await findUserByUsername(username);
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        // Only allow admin login
        if (user.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access only' });
        }
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        req.session.userId = user.id;
        req.session.username = user.username;
        req.session.role = user.role;
        req.session.email = user.email;
        res.json({ success: true, user: { id: user.id, username: user.username, email: user.email, role: user.role } });
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/auth/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: 'Error logging out' });
        }
        res.json({ success: true, message: 'Logged out successfully' });
    });
});

app.get('/api/auth/me', (req, res) => {
    if (req.session && req.session.userId && req.session.role === 'admin') {
        res.json({
            user: {
                id: req.session.userId,
                username: req.session.username,
                email: req.session.email,
                role: req.session.role,
                firstName: req.session.firstName,
                lastName: req.session.lastName
            }
        });
    } else {
        res.json({ user: null });
    }
});


// Reviews API (public - lecture et écriture sans auth)
app.get('/api/reviews', async (req, res) => {
    try {
        const reviews = await readReviews();
        const limit = parseInt(req.query.limit) || 50;
        const sorted = reviews
            .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
            .slice(0, limit);
        res.json({ reviews: sorted });
    } catch (error) {
        console.error('Error fetching reviews:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/reviews', async (req, res) => {
    try {
        const { author, rating, comment } = req.body || {};
        if (!author || typeof author !== 'string' || !author.trim()) {
            return res.status(400).json({ error: 'Author name is required' });
        }
        const r = Number(rating);
        if (isNaN(r) || r < 1 || r > 5) {
            return res.status(400).json({ error: 'Rating must be a number between 1 and 5' });
        }
        const reviews = await readReviews();
        const review = {
            id: uuidv4(),
            author: String(author).trim().slice(0, 100),
            rating: Math.round(r),
            comment: typeof comment === 'string' ? comment.trim().slice(0, 1000) : '',
            createdAt: new Date().toISOString()
        };
        reviews.push(review);
        await writeReviews(reviews);
        console.log(`📝 New review from ${review.author} (${review.rating}/5)`);
        res.status(201).json({ success: true, review });
    } catch (error) {
        console.error('Error adding review:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Stats route
app.get('/api/stats', async (req, res) => {
    try {
        const shipments = await readShipments();
        console.log(`📊 Stats requested: ${shipments.length} total shipments`);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const activeShipments = shipments.filter(s => s.status !== 'delivered').length;
        const deliveredToday = shipments.filter(s => {
            if (!s.deliveredAt) return false;
            const deliveredDate = new Date(s.deliveredAt);
            deliveredDate.setHours(0, 0, 0, 0);
            return deliveredDate.getTime() === today.getTime();
        }).length;
        const pending = shipments.filter(s => s.status === 'pending').length;
        const delivered = shipments.filter(s => s.status === 'delivered').length;
        const inTransit = shipments.filter(s => s.status === 'in_transit' || s.status === 'out_for_delivery' || s.status === 'picked_up').length;
        const countries = new Set();
        shipments.forEach(s => {
            if (s.sender?.address?.country) countries.add(s.sender.address.country);
            if (s.recipient?.address?.country) countries.add(s.recipient.address.country);
        });
        res.json({
            activeShipments: activeShipments || 0,
            deliveredToday: deliveredToday || 0,
            countriesServed: countries.size || 47,
            totalShipments: shipments.length,
            pending: pending || 0,
            delivered: delivered || 0,
            inTransit: inTransit || 0
        });
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/shipments/recent', async (req, res) => {
    try {
        const shipments = await readShipments();
        const limit = parseInt(req.query.limit) || 3;
        
        // Filter shipments based on authentication
        let filteredShipments = shipments;
        
        // If user is authenticated (but not admin), only show their shipments
        if (req.session && req.session.email && req.session.role !== 'admin') {
            const userEmail = req.session.email.toLowerCase();
            filteredShipments = shipments.filter(s => 
                s.sender?.email?.toLowerCase() === userEmail || 
                s.recipient?.email?.toLowerCase() === userEmail
            );
            console.log(`📦 Recent shipments requested by user ${req.session.email}: ${filteredShipments.length} shipments (filtered from ${shipments.length} total)`);
        } else if (!req.session || !req.session.email) {
            // Public users see no shipments (empty list)
            console.log(`📦 Recent shipments requested by anonymous user: returning empty list`);
            return res.json([]);
        } else {
            // Admin users see all shipments
            console.log(`📦 Recent shipments requested by admin: ${shipments.length} total shipments`);
        }
        
        const recentShipments = filteredShipments
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, limit)
            .map(s => ({
                trackingId: s.trackingId,
                status: s.status,
                sender: s.sender,
                recipient: s.recipient,
                estimatedDelivery: s.estimatedDelivery,
                deliveredAt: s.deliveredAt,
                package: s.package
            }));
        res.json(recentShipments);
    } catch (error) {
        console.error('Error fetching recent shipments:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Shipment routes

app.get('/api/shipments/:trackingId', async (req, res) => {
    try {
        const { trackingId } = req.params;
        const shipments = await readShipments();
        const shipment = shipments.find(s => s.trackingId === trackingId.toUpperCase());
        
        if (!shipment) {
            return res.status(404).json({ error: 'Shipment not found', message: `No shipment found with tracking ID: ${trackingId}` });
        }

        // Security check: Tracking ID is considered a secret - anyone with the ID can view it
        // This allows clients to track shipments even if they're logged in with a different email
        // Admins can always access all shipments
        // Note: If you want stricter access control, you can uncomment the code below
        /*
        if (req.session && req.session.email && req.session.role !== 'admin') {
            const userEmail = req.session.email.toLowerCase();
            const isSender = shipment.sender?.email?.toLowerCase() === userEmail;
            const isRecipient = shipment.recipient?.email?.toLowerCase() === userEmail;
            
            if (!isSender && !isRecipient) {
                console.log(`⚠️ Unauthorized access attempt: User ${req.session.email} tried to access shipment ${trackingId}`);
                return res.status(403).json({ 
                    error: 'Access denied', 
                    message: 'You do not have permission to view this shipment' 
                });
            }
        }
        */

        // Calculer la route si elle n'existe pas encore (même sans autoProgress)
        if (!shipment.routeGeometry && 
            shipment.sender?.address?.lat && shipment.recipient?.address?.lat) {
            console.log(`🛣️ Calculating route for ${trackingId}...`);
            const routeData = await getRouteFromOSRM(
                shipment.sender.address.lat,
                shipment.sender.address.lng,
                shipment.recipient.address.lat,
                shipment.recipient.address.lng
            );
            if (routeData) {
                shipment.routeGeometry = routeData.geometry;
                shipment.routeDistanceMiles = routeData.distanceMiles;
                console.log(`✅ Route calculated and saved for ${trackingId}: ${routeData.geometry.length} points`);
                // Sauvegarder immédiatement
                const shipmentIndex = shipments.findIndex(s => s.trackingId === trackingId);
                if (shipmentIndex !== -1) {
                    shipments[shipmentIndex].routeGeometry = shipment.routeGeometry;
                    shipments[shipmentIndex].routeDistanceMiles = shipment.routeDistanceMiles;
                    await writeShipments(shipments);
                    // Mettre à jour shipment pour qu'il contienne la route dans la réponse
                    shipment.routeGeometry = routeData.geometry;
                    shipment.routeDistanceMiles = routeData.distanceMiles;
                }
            } else {
                console.log(`⚠️ Failed to calculate route for ${trackingId}`);
            }
        }

        // Calculer la progression même pour "pending" si autoProgress est activé
        if (shipment.autoProgress?.enabled && !shipment.autoProgress?.paused && 
            shipment.status !== 'delivered' &&
            shipment.sender?.address?.lat && shipment.recipient?.address?.lat) {
            
            // S'assurer que startedAt est défini si autoProgress est activé
            if (!shipment.autoProgress.startedAt && shipment.createdAt) {
                shipment.autoProgress.startedAt = shipment.createdAt;
                console.log(`🚀 Auto-progression démarrée pour ${trackingId} (utilise createdAt)`);
            }
            
            const autoPos = await calculateAutomaticProgression(shipment);
            if (autoPos) {
                const oldCity = shipment.currentLocation?.city || 'Unknown';
                shipment.currentLocation = { lat: autoPos.lat, lng: autoPos.lng, city: autoPos.city };
                shipment.autoProgress.lastUpdate = new Date().toISOString();
                if (oldCity !== autoPos.city) {
                    console.log(`📍 ${trackingId}: Position updated - ${oldCity} → ${autoPos.city} (Progress: ${(autoPos.progress * 100).toFixed(1)}%)`);
                } else {
                    console.log(`📍 ${trackingId}: Position updated - ${autoPos.city} (Progress: ${(autoPos.progress * 100).toFixed(1)}%)`);
                }
                shipment.updatedAt = new Date().toISOString();
                
                // Sauvegarder la route si elle vient d'être calculée
                const existingShipment = shipments.find(s => s.trackingId === trackingId);
                if (shipment.routeGeometry && (!existingShipment || !existingShipment.routeGeometry)) {
                    console.log(`🛣️ Route sauvegardée pour ${trackingId}: ${shipment.routeGeometry.length} points`);
                    // Mettre à jour le shipment dans le tableau
                    const shipmentIndex = shipments.findIndex(s => s.trackingId === trackingId);
                    if (shipmentIndex !== -1) {
                        shipments[shipmentIndex].routeGeometry = shipment.routeGeometry;
                        shipments[shipmentIndex].routeDistanceMiles = shipment.routeDistanceMiles;
                    }
                }

                // Update in database (JSON files)
                await writeShipments(shipments);
                
                // Mettre à jour shipment avec les données sauvegardées pour s'assurer que routeGeometry est inclus
                const updatedShipment = shipments.find(s => s.trackingId === trackingId);
                if (updatedShipment) {
                    shipment.routeGeometry = updatedShipment.routeGeometry;
                    shipment.routeDistanceMiles = updatedShipment.routeDistanceMiles;
                }
            } else {
                console.log(`⚠️ calculateAutomaticProgression returned null for ${trackingId}`);
            }
        } else {
            if (!shipment.autoProgress?.enabled) {
                console.log(`⚠️ Auto-progression désactivée pour ${trackingId}`);
            } else if (shipment.autoProgress?.paused) {
                console.log(`⚠️ Auto-progression en pause pour ${trackingId}`);
            } else if (!shipment.sender?.address?.lat || !shipment.recipient?.address?.lat) {
                console.log(`⚠️ Coordonnées manquantes pour ${trackingId}`);
            }
        }
        
        // S'assurer que routeGeometry est inclus dans la réponse
        const finalShipment = shipments.find(s => s.trackingId === trackingId) || shipment;
        res.json(finalShipment);
    } catch (error) {
        console.error('Error fetching shipment:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/shipments', async (req, res) => {
    try {
        console.log('📦 Creating new shipment...');
        console.log('Request body:', JSON.stringify(req.body, null, 2));
        
        const trackingId = generateTrackingId();
        const newShipment = {
            id: uuidv4(),
            trackingId: trackingId,
            status: 'pending',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            sender: {
                name: req.body.sender?.name || '',
                email: req.body.sender?.email || '',
                phone: req.body.sender?.phone || '',
                address: {
                    street: req.body.sender?.address?.street || '',
                    city: req.body.sender?.address?.city || '',
                    state: req.body.sender?.address?.state || '',
                    zipCode: req.body.sender?.address?.zipCode || '',
                    country: req.body.sender?.address?.country || 'CM',
                    lat: null,
                    lng: null
                }
            },
            recipient: {
                name: req.body.recipient?.name || '',
                email: req.body.recipient?.email || '',
                phone: req.body.recipient?.phone || '',
                address: {
                    street: req.body.recipient?.address?.street || '',
                    city: req.body.recipient?.address?.city || '',
                    state: req.body.recipient?.address?.state || '',
                    zipCode: req.body.recipient?.address?.zipCode || '',
                    country: req.body.recipient?.address?.country || 'CM',
                    lat: null,
                    lng: null
                }
            },
            package: {
                type: req.body.package?.type || 'custom',
                weight: req.body.package?.weight || 0,
                dimensions: {
                    length: req.body.package?.dimensions?.length || 0,
                    width: req.body.package?.dimensions?.width || 0,
                    height: req.body.package?.dimensions?.height || 0
                },
                description: req.body.package?.description || '',
                value: req.body.package?.value || 0,
                currency: req.body.package?.currency || 'XAF',
                vehicle: req.body.package?.vehicle || {}
            },
            service: {
                type: req.body.service?.type || 'standard',
                priority: req.body.service?.priority || 'normal',
                insurance: req.body.service?.insurance || false
            },
            events: [{
                id: uuidv4(),
                status: 'pending',
                title: 'Shipment Created',
                description: 'Your shipment has been created and is awaiting pickup',
                location: req.body.sender?.address?.city || '',
                timestamp: new Date().toISOString(),
                completed: true,
                current: false
            }],
            cost: {
                base: parseFloat(req.body.cost?.base) || 0,
                shipping: parseFloat(req.body.cost?.shipping) || 0,
                insurance: parseFloat(req.body.cost?.insurance) || 0,
                total: (parseFloat(req.body.cost?.base) || 0) + (parseFloat(req.body.cost?.shipping) || 0) + (parseFloat(req.body.cost?.insurance) || 0),
                currency: req.body.cost?.currency || 'XAF'
            },
            estimatedDelivery: req.body.estimatedDelivery || null,
            currentLocation: {
                lat: null,
                lng: null,
                city: req.body.sender?.address?.city || ''
            },
            autoProgress: {
                enabled: true,
                paused: false,
                pausedAt: null,
                pauseReason: null,
                pausedDuration: 0,
                startedAt: null,
                lastUpdate: null
            }
        };

        const senderCity = req.body.sender?.address?.city || '';
        const senderState = req.body.sender?.address?.state || '';
        const senderCountry = req.body.sender?.address?.country || 'CM';
        const senderZip = req.body.sender?.address?.zipCode || '';
        const senderLocation = senderCity + (senderState ? ', ' + senderState : '') + (senderCountry ? ', ' + senderCountry : '');
        const senderCoords = getCityCoordinates({
            city: senderCity,
            state: senderState,
            country: senderCountry,
            zipCode: senderZip
        });
        if (senderCoords) {
            newShipment.sender.address.lat = senderCoords.lat;
            newShipment.sender.address.lng = senderCoords.lng;
            console.log(`ðŸ“ Origin coordinates: ${senderLocation} â†’ [${senderCoords.lat}, ${senderCoords.lng}]`);
        }

        const recipientCity = req.body.recipient?.address?.city || '';
        const recipientState = req.body.recipient?.address?.state || '';
        const recipientCountry = req.body.recipient?.address?.country || 'CM';
        const recipientZip = req.body.recipient?.address?.zipCode || '';
        const recipientLocation = recipientCity + (recipientState ? ', ' + recipientState : '') + (recipientCountry ? ', ' + recipientCountry : '');
        const recipientCoords = getCityCoordinates({
            city: recipientCity,
            state: recipientState,
            country: recipientCountry,
            zipCode: recipientZip
        });
        if (recipientCoords) {
            newShipment.recipient.address.lat = recipientCoords.lat;
            newShipment.recipient.address.lng = recipientCoords.lng;
            console.log(`ðŸ“ Destination coordinates: ${recipientLocation} â†’ [${recipientCoords.lat}, ${recipientCoords.lng}]`);
        }

        if (senderCoords) {
            newShipment.currentLocation = {
                lat: senderCoords.lat,
                lng: senderCoords.lng,
                city: senderCity
            };
        }

        // Initialiser startedAt si autoProgress est activé et que les coordonnées sont disponibles
        if (newShipment.autoProgress.enabled && senderCoords && recipientCoords) {
            newShipment.autoProgress.startedAt = new Date().toISOString();
            console.log(`🚀 Auto-progression démarrée pour ${trackingId}`);
        }

        if (!newShipment.estimatedDelivery && senderCoords && recipientCoords) {
            const distance = calculateHaversineDistance(
                senderCoords.lat, senderCoords.lng,
                recipientCoords.lat, recipientCoords.lng
            );
            const hours = (distance / 50) + 8;
            const deliveryDate = new Date();
            deliveryDate.setHours(deliveryDate.getHours() + hours);
            newShipment.estimatedDelivery = deliveryDate.toISOString();
        }

        // Save to database (JSON files)
        const shipments = await readShipments();
        shipments.push(newShipment);
        const writeSuccess = await writeShipments(shipments);
        if (!writeSuccess) {
            throw new Error('Failed to save shipment to database');
        }
        
        // Verify the shipment was written
        const verifyShipments = await readShipments();
        const savedShipment = verifyShipments.find(s => s.trackingId === newShipment.trackingId);
        if (!savedShipment) {
            console.error('⚠️ Warning: Shipment was not found after write!');
        } else {
            console.log(`✅ Shipment created and verified: ${newShipment.trackingId} (Total shipments: ${verifyShipments.length})`);
        }
        
        res.status(201).json(savedShipment || newShipment);
    } catch (error) {
        console.error('❌ Error creating shipment:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({ error: 'Internal server error: ' + error.message });
    }
});

app.put('/api/shipments/:trackingId/status', requireAuth, requireAdmin, async (req, res) => {
    try {
        const { trackingId } = req.params;
        const { status, location, description } = req.body;
        
        // Get shipment from database
        const shipments = await readShipments();
        const shipmentIndex = shipments.findIndex(s => s.trackingId === trackingId.toUpperCase());
        if (shipmentIndex === -1) {
            return res.status(404).json({ error: 'Shipment not found' });
        }
        const shipment = shipments[shipmentIndex];
        shipment.events.forEach(event => {
            event.completed = true;
            event.current = false;
        });
        const statusMap = {
            'pending': { title: 'Pending Pickup', description: 'Awaiting carrier pickup' },
            'picked_up': { title: 'Picked Up', description: 'Package picked up by carrier' },
            'in_transit': { title: 'In Transit', description: 'Package is in transit' },
            'out_for_delivery': { title: 'Out for Delivery', description: 'Package is out for delivery' },
            'delivered': { title: 'Delivered', description: 'Package has been delivered' },
            'exception': { title: 'Exception', description: 'An exception occurred' }
        };
        const statusInfo = statusMap[status] || { title: status, description: description || '' };
        shipment.events.push({
            id: uuidv4(),
            status: status,
            title: statusInfo.title,
            description: description || statusInfo.description,
            location: location || shipment.currentLocation?.city || '',
            timestamp: new Date().toISOString(),
            completed: status === 'delivered',
            current: status !== 'delivered'
        });

        if (!shipment.autoProgress) {
            shipment.autoProgress = {
                enabled: true,
                paused: false,
                pausedAt: null,
                pauseReason: null,
                pausedDuration: 0,
                startedAt: null,
                lastUpdate: null
            };
        }

        const wasPending = shipment.status === 'pending';
        const isNowActive = status !== 'pending' && status !== 'delivered';

        if (wasPending && isNowActive && !shipment.autoProgress.startedAt) {
            shipment.autoProgress.startedAt = new Date().toISOString();
            shipment.autoProgress.enabled = true;
            shipment.autoProgress.paused = false;
            console.log(`ðŸš€ ${trackingId}: Auto-progression dÃ©marrÃ©e automatiquement (statut: ${status})`);
        }

        if (status === 'delivered') {
            const destCity = shipment.recipient?.address?.city || location || '';
            const destCoords = shipment.recipient?.address?.lat && shipment.recipient?.address?.lng
                ? { lat: shipment.recipient.address.lat, lng: shipment.recipient.address.lng }
                : getCityCoordinates(shipment.recipient?.address || destCity);
            shipment.currentLocation = {
                lat: destCoords?.lat || shipment.recipient?.address?.lat || null,
                lng: destCoords?.lng || shipment.recipient?.address?.lng || null,
                city: destCity
            };
        } else if (status === 'pending') {
            const originCity = shipment.sender?.address?.city || location || '';
            const originCoords = shipment.sender?.address?.lat && shipment.sender?.address?.lng
                ? { lat: shipment.sender.address.lat, lng: shipment.sender.address.lng }
                : getCityCoordinates(shipment.sender?.address || originCity);
            shipment.currentLocation = {
                lat: originCoords?.lat || shipment.sender?.address?.lat || null,
                lng: originCoords?.lng || shipment.sender?.address?.lng || null,
                city: originCity
            };
            shipment.autoProgress.startedAt = null;
        } else if (location && location.trim() !== '') {
            const locationCoords = getCityCoordinates(location);
            shipment.currentLocation = {
                lat: locationCoords?.lat || shipment.currentLocation?.lat || null,
                lng: locationCoords?.lng || shipment.currentLocation?.lng || null,
                city: location
            };
            console.log(`ðŸ“ ${trackingId}: Location manuelle dÃ©finie par admin - ${location}`);
        } else if (isNowActive && shipment.autoProgress.enabled && !shipment.autoProgress.paused) {
            if (!shipment.autoProgress.startedAt) {
                shipment.autoProgress.startedAt = new Date().toISOString();
            }
            const autoPos = await calculateAutomaticProgression(shipment);
            if (autoPos) {
                shipment.currentLocation = { lat: autoPos.lat, lng: autoPos.lng, city: autoPos.city };
                shipment.autoProgress.lastUpdate = new Date().toISOString();
            }
        }

        shipment.status = status;
        shipment.updatedAt = new Date().toISOString();
        if (status === 'delivered') {
            shipment.deliveredAt = new Date().toISOString();
        }
        
        // Update in database (JSON files)
        await writeShipments(shipments);
        const updatedShipment = shipment;
        
        res.json(updatedShipment);
    } catch (error) {
        console.error('Error updating shipment status:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.put('/api/shipments/:trackingId/pause', requireAuth, requireAdmin, async (req, res) => {
    try {
        const { trackingId } = req.params;
        const { pause, reason } = req.body;
        
        // Get shipment from database
        const shipments = await readShipments();
        const shipmentIndex = shipments.findIndex(s => s.trackingId === trackingId.toUpperCase());
        if (shipmentIndex === -1) {
            return res.status(404).json({ error: 'Shipment not found' });
        }
        const shipment = shipments[shipmentIndex];
        if (!shipment.autoProgress) {
            shipment.autoProgress = {
                enabled: true,
                paused: false,
                pausedAt: null,
                pauseReason: null,
                pausedDuration: 0,
                startedAt: null,
                lastUpdate: null
            };
        }
        if (pause === true || pause === 'true') {
            if (!shipment.autoProgress.paused) {
                shipment.autoProgress.paused = true;
                shipment.autoProgress.pausedAt = new Date().toISOString();
                shipment.autoProgress.pauseReason = reason || 'Maintenance';
                shipment.events.push({
                    id: uuidv4(),
                    status: 'exception',
                    title: 'Shipment Paused',
                    description: reason || 'Shipment paused for maintenance',
                    location: shipment.currentLocation?.city || '',
                    timestamp: new Date().toISOString(),
                    completed: false,
                    current: true
                });
                console.log(`â¸ï¸ Shipment ${trackingId} paused: ${reason || 'Maintenance'}`);
            }
        } else {
            if (shipment.autoProgress.paused) {
                if (shipment.autoProgress.pausedAt) {
                    const pauseStart = new Date(shipment.autoProgress.pausedAt);
                    const now = new Date();
                    const pauseDuration = now - pauseStart;
                    shipment.autoProgress.pausedDuration = (shipment.autoProgress.pausedDuration || 0) + pauseDuration;
                }
                shipment.autoProgress.paused = false;
                const pauseReason = shipment.autoProgress.pauseReason;
                shipment.autoProgress.pauseReason = null;
                shipment.autoProgress.pausedAt = null;
                shipment.events.push({
                    id: uuidv4(),
                    status: 'in_transit',
                    title: 'Shipment Resumed',
                    description: `Shipment resumed after: ${pauseReason || 'maintenance'}`,
                    location: shipment.currentLocation?.city || '',
                    timestamp: new Date().toISOString(),
                    completed: false,
                    current: true
                });
                console.log(`â–¶ï¸ Shipment ${trackingId} resumed after: ${pauseReason || 'maintenance'}`);
            }
        }
        shipment.updatedAt = new Date().toISOString();
        
        // Update in database (JSON files)
        await writeShipments(shipments);
        const updatedShipment = shipment;
        
        res.json(updatedShipment);
    } catch (error) {
        console.error('Error pausing/resuming shipment:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Generate receipt for a shipment (MUST BE BEFORE /receipt route)
app.post('/api/shipments/:trackingId/receipt/generate', requireAuth, requireAdmin, async (req, res) => {
    try {
        const { trackingId } = req.params;
        const { language = 'en' } = req.body; // Get language from request body, default to English
        console.log('📄 Generating receipt for shipment:', trackingId, 'in language:', language);

        // Get shipment from database
        const shipments = await readShipments();
        const shipmentIndex = shipments.findIndex(s => s.trackingId === trackingId.toUpperCase());
        if (shipmentIndex === -1) {
            return res.status(404).json({ error: 'Shipment not found' });
        }
        const shipment = shipments[shipmentIndex];
        
        if (!shipment) {
            return res.status(404).json({ error: 'Shipment not found' });
        }
        
        // LOG: Verify shipment currency before generating PDF
        console.log('🔍 [RECEIPT GENERATION] Shipment data before PDF generation:');
        console.log('🔍 Tracking ID:', trackingId);
        console.log('🔍 Cost object:', JSON.stringify(shipment.cost));
        console.log('🔍 Cost currency:', shipment.cost?.currency);
        console.log('🔍 Package currency:', shipment.package?.currency);
        console.log('🔍 Full shipment keys:', Object.keys(shipment));
        
        // Generate PDF receipt
        const receiptFilename = `receipt-${trackingId}-${Date.now()}.pdf`;
        const receiptPath = path.join(RECEIPTS_DIR, receiptFilename);
        
        await generateReceiptPDF(shipment, receiptPath, language);

        // Store receipt path relative to public directory
        const receiptUrl = `/receipts/${receiptFilename}`;
        shipment.receipt = receiptUrl;
        shipment.receiptUploadedAt = new Date().toISOString();
        shipment.updatedAt = new Date().toISOString();

        // Update in database (JSON files)
        shipments[shipmentIndex] = shipment;
        await writeShipments(shipments);
        const updatedShipment = shipment;
        
        res.json({ success: true, receipt: receiptUrl, shipment: updatedShipment });
    } catch (error) {
        console.error('Error generating receipt:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Receipt translations for PDF generation
const receiptTranslations = {
    en: {
        header: 'PROFESSIONAL SHIPMENT SERVICES',
        receiptTitle: 'SHIPMENT RECEIPT',
        trackingNumber: 'TRACKING NUMBER',
        shipmentInfo: 'SHIPMENT INFORMATION',
        sender: 'SENDER',
        recipient: 'RECIPIENT',
        packageDetails: 'PACKAGE DETAILS',
        costBreakdown: 'COST BREAKDOWN',
        total: 'TOTAL',
        created: 'Created:',
        lastUpdated: 'Last Updated:',
        estDelivery: 'Est. Delivery:',
        delivered: 'Delivered:',
        currentLocation: 'Current Location:',
        pickedUp: 'Picked Up:',
        status: {
            pending: 'PENDING (insurance needed)',
            picked_up: 'PICKED UP',
            in_transit: 'IN TRANSIT',
            out_for_delivery: 'OUT FOR DELIVERY',
            delivered: 'DELIVERED',
            exception: 'EXCEPTION'
        },
        messages: {
            pending: { title: 'URGENT: Insurance Required', text: 'This shipment requires insurance before it can be processed. Please contact us immediately.' },
            in_transit: { title: 'Package In Transit', text: 'Your package is currently en route. Tracking updates will be available as it progresses.' },
            out_for_delivery: { title: 'Out for Delivery - Arriving Today!', text: 'Your package is out for delivery and will arrive today. Please ensure someone is available to receive it.' },
            delivered: { title: 'Successfully Delivered', text: 'Your package has been successfully delivered. Thank you for choosing CargoWatch!' },
            picked_up: { title: 'Package Picked Up', text: 'Your package has been picked up and is now in our possession. It will begin transit shortly.' },
            exception: { title: 'EXCEPTION - Action Required', text: 'An exception has occurred with your shipment. Please contact our support team immediately for assistance.' }
        },
        footer: 'This is an official receipt generated by CargoWatch'
    },
    fr: {
        header: 'SERVICES D\'EXPÉDITION PROFESSIONNELS',
        receiptTitle: 'REÇU D\'EXPÉDITION',
        trackingNumber: 'NUMÉRO DE SUIVI',
        shipmentInfo: 'INFORMATIONS D\'EXPÉDITION',
        sender: 'EXPÉDITEUR',
        recipient: 'DESTINATAIRE',
        packageDetails: 'DÉTAILS DU COLIS',
        costBreakdown: 'DÉTAIL DES COÛTS',
        total: 'TOTAL',
        created: 'Créé le:',
        lastUpdated: 'Dernière mise à jour:',
        estDelivery: 'Livraison estimée:',
        delivered: 'Livré le:',
        currentLocation: 'Localisation actuelle:',
        pickedUp: 'Récupéré le:',
        status: {
            pending: 'EN ATTENTE (assurance requise)',
            picked_up: 'RÉCUPÉRÉ',
            in_transit: 'EN TRANSIT',
            out_for_delivery: 'EN LIVRAISON',
            delivered: 'LIVRÉ',
            exception: 'EXCEPTION'
        },
        messages: {
            pending: { title: 'URGENT: Assurance requise', text: 'Cette expédition nécessite une assurance avant de pouvoir être traitée. Veuillez nous contacter immédiatement.' },
            in_transit: { title: 'Colis en transit', text: 'Votre colis est actuellement en route. Les mises à jour de suivi seront disponibles au fur et à mesure de sa progression.' },
            out_for_delivery: { title: 'En livraison - Arrivée aujourd\'hui!', text: 'Votre colis est en cours de livraison et arrivera aujourd\'hui. Veuillez vous assurer que quelqu\'un est disponible pour le recevoir.' },
            delivered: { title: 'Livré avec succès', text: 'Votre colis a été livré avec succès. Merci d\'avoir choisi CargoWatch!' },
            picked_up: { title: 'Colis récupéré', text: 'Votre colis a été récupéré et est maintenant en notre possession. Il commencera le transit sous peu.' },
            exception: { title: 'EXCEPTION - Action requise', text: 'Une exception s\'est produite avec votre expédition. Veuillez contacter immédiatement notre équipe de support pour obtenir de l\'aide.' }
        },
        footer: 'Ceci est un reçu officiel généré par CargoWatch'
    },
    it: {
        header: 'SERVIZI DI SPEDIZIONE PROFESSIONALI',
        receiptTitle: 'RICEVUTA DI SPEDIZIONE',
        trackingNumber: 'NUMERO DI TRACCIAMENTO',
        shipmentInfo: 'INFORMAZIONI SULLA SPEDIZIONE',
        sender: 'MITTENTE',
        recipient: 'DESTINATARIO',
        packageDetails: 'DETTAGLI DEL PACCO',
        costBreakdown: 'RIEPILOGO COSTI',
        total: 'TOTALE',
        created: 'Creato il:',
        lastUpdated: 'Ultimo aggiornamento:',
        estDelivery: 'Consegna stimata:',
        delivered: 'Consegnato il:',
        currentLocation: 'Posizione attuale:',
        pickedUp: 'Ritirato il:',
        status: {
            pending: 'IN ATTESA (assicurazione necessaria)',
            picked_up: 'RITIRATO',
            in_transit: 'IN TRANSITO',
            out_for_delivery: 'IN CONSEGNA',
            delivered: 'CONSEGNATO',
            exception: 'ECCEZIONE'
        },
        messages: {
            pending: { title: 'URGENTE: Assicurazione richiesta', text: 'Questa spedizione richiede un\'assicurazione prima di poter essere processata. Si prega di contattarci immediatamente.' },
            in_transit: { title: 'Pacco in transito', text: 'Il tuo pacco è attualmente in viaggio. Gli aggiornamenti di tracciamento saranno disponibili man mano che procede.' },
            out_for_delivery: { title: 'In consegna - Arrivo oggi!', text: 'Il tuo pacco è in consegna e arriverà oggi. Assicurati che qualcuno sia disponibile per riceverlo.' },
            delivered: { title: 'Consegnato con successo', text: 'Il tuo pacco è stato consegnato con successo. Grazie per aver scelto CargoWatch!' },
            picked_up: { title: 'Pacco ritirato', text: 'Il tuo pacco è stato ritirato ed è ora in nostro possesso. Inizierà il transito a breve.' },
            exception: { title: 'ECCEZIONE - Azione richiesta', text: 'Si è verificata un\'eccezione con la tua spedizione. Contatta immediatamente il nostro team di supporto per assistenza.' }
        },
        footer: 'Questa è una ricevuta ufficiale generata da CargoWatch'
    },
    es: {
        header: 'SERVICIOS DE ENVÍO PROFESIONALES',
        receiptTitle: 'RECIBO DE ENVÍO',
        trackingNumber: 'NÚMERO DE SEGUIMIENTO',
        shipmentInfo: 'INFORMACIÓN DEL ENVÍO',
        sender: 'REMITENTE',
        recipient: 'DESTINATARIO',
        packageDetails: 'DETALLES DEL PAQUETE',
        costBreakdown: 'DESGLOSE DE COSTOS',
        total: 'TOTAL',
        created: 'Creado:',
        lastUpdated: 'Última actualización:',
        estDelivery: 'Entrega estimada:',
        delivered: 'Entregado:',
        currentLocation: 'Ubicación actual:',
        pickedUp: 'Recogido:',
        status: {
            pending: 'PENDIENTE (seguro necesario)',
            picked_up: 'RECOGIDO',
            in_transit: 'EN TRÁNSITO',
            out_for_delivery: 'EN ENTREGA',
            delivered: 'ENTREGADO',
            exception: 'EXCEPCIÓN'
        },
        messages: {
            pending: { title: 'URGENTE: Seguro requerido', text: 'Este envío requiere seguro antes de poder ser procesado. Por favor contáctenos inmediatamente.' },
            in_transit: { title: 'Paquete en tránsito', text: 'Su paquete está actualmente en camino. Las actualizaciones de seguimiento estarán disponibles a medida que avance.' },
            out_for_delivery: { title: '¡En entrega - Llega hoy!', text: 'Su paquete está en entrega y llegará hoy. Por favor asegúrese de que alguien esté disponible para recibirlo.' },
            delivered: { title: 'Entregado exitosamente', text: 'Su paquete ha sido entregado exitosamente. ¡Gracias por elegir CargoWatch!' },
            picked_up: { title: 'Paquete recogido', text: 'Su paquete ha sido recogido y ahora está en nuestra posesión. Comenzará el tránsito en breve.' },
            exception: { title: 'EXCEPCIÓN - Acción requerida', text: 'Ha ocurrido una excepción con su envío. Por favor contacte inmediatamente a nuestro equipo de soporte para asistencia.' }
        },
        footer: 'Este es un recibo oficial generado por CargoWatch'
    },
    de: {
        header: 'PROFESSIONELLE VERSANDDIENSTE',
        receiptTitle: 'VERSANDRECHNUNG',
        trackingNumber: 'SENDUNGSNUMMER',
        shipmentInfo: 'VERSANDINFORMATIONEN',
        sender: 'ABSENDER',
        recipient: 'EMPFÄNGER',
        packageDetails: 'PAKETDETAILS',
        costBreakdown: 'KOSTENAUFSTELLUNG',
        total: 'GESAMT',
        created: 'Erstellt:',
        lastUpdated: 'Zuletzt aktualisiert:',
        estDelivery: 'Geschätzte Lieferung:',
        delivered: 'Geliefert:',
        currentLocation: 'Aktueller Standort:',
        pickedUp: 'Abgeholt:',
        status: {
            pending: 'AUSSTEHEND (Versicherung erforderlich)',
            picked_up: 'ABGEHOLT',
            in_transit: 'UNTERWEGS',
            out_for_delivery: 'ZUR ZUSTELLUNG',
            delivered: 'GELIEFERT',
            exception: 'AUSNAHME'
        },
        messages: {
            pending: { title: 'DRINGEND: Versicherung erforderlich', text: 'Diese Sendung erfordert eine Versicherung, bevor sie bearbeitet werden kann. Bitte kontaktieren Sie uns sofort.' },
            in_transit: { title: 'Paket unterwegs', text: 'Ihr Paket ist derzeit unterwegs. Tracking-Updates werden verfügbar sein, während es fortschreitet.' },
            out_for_delivery: { title: 'Zur Zustellung - Kommt heute an!', text: 'Ihr Paket ist zur Zustellung unterwegs und wird heute ankommen. Bitte stellen Sie sicher, dass jemand verfügbar ist, um es zu empfangen.' },
            delivered: { title: 'Erfolgreich geliefert', text: 'Ihr Paket wurde erfolgreich geliefert. Vielen Dank, dass Sie CargoWatch gewählt haben!' },
            picked_up: { title: 'Paket abgeholt', text: 'Ihr Paket wurde abgeholt und befindet sich jetzt in unserem Besitz. Es wird in Kürze den Transit beginnen.' },
            exception: { title: 'AUSNAHME - Aktion erforderlich', text: 'Es ist eine Ausnahme bei Ihrer Sendung aufgetreten. Bitte kontaktieren Sie sofort unser Support-Team für Hilfe.' }
        },
        footer: 'Dies ist eine offizielle Rechnung, die von CargoWatch generiert wurde'
    },
    pt: {
        header: 'SERVIÇOS PROFISSIONAIS DE ENVIO',
        receiptTitle: 'RECIBO DE ENVIO',
        trackingNumber: 'NÚMERO DE RASTREAMENTO',
        shipmentInfo: 'INFORMAÇÕES DO ENVIO',
        sender: 'REMETENTE',
        recipient: 'DESTINATÁRIO',
        packageDetails: 'DETALHES DO PACOTE',
        costBreakdown: 'DETALHAMENTO DE CUSTOS',
        total: 'TOTAL',
        created: 'Criado:',
        lastUpdated: 'Última atualização:',
        estDelivery: 'Entrega estimada:',
        delivered: 'Entregue:',
        currentLocation: 'Localização atual:',
        pickedUp: 'Coletado:',
        status: {
            pending: 'PENDENTE (seguro necessário)',
            picked_up: 'COLETADO',
            in_transit: 'EM TRÂNSITO',
            out_for_delivery: 'SAIU PARA ENTREGA',
            delivered: 'ENTREGUE',
            exception: 'EXCEÇÃO'
        },
        messages: {
            pending: { title: 'URGENTE: Seguro necessário', text: 'Este envio requer seguro antes de poder ser processado. Por favor, entre em contato conosco imediatamente.' },
            in_transit: { title: 'Pacote em trânsito', text: 'Seu pacote está atualmente a caminho. Atualizações de rastreamento estarão disponíveis conforme ele progride.' },
            out_for_delivery: { title: 'Saiu para entrega - Chegando hoje!', text: 'Seu pacote saiu para entrega e chegará hoje. Por favor, certifique-se de que alguém esteja disponível para recebê-lo.' },
            delivered: { title: 'Entregue com sucesso', text: 'Seu pacote foi entregue com sucesso. Obrigado por escolher CargoWatch!' },
            picked_up: { title: 'Pacote coletado', text: 'Seu pacote foi coletado e agora está em nossa posse. Ele começará o trânsito em breve.' },
            exception: { title: 'EXCEÇÃO - Ação necessária', text: 'Ocorreu uma exceção com seu envio. Por favor, entre em contato imediatamente com nossa equipe de suporte para assistência.' }
        },
        footer: 'Este é um recibo oficial gerado por CargoWatch'
    },
    zh: {
        header: '专业货运服务',
        receiptTitle: '货运收据',
        trackingNumber: '追踪号码',
        shipmentInfo: '货运信息',
        sender: '寄件人',
        recipient: '收件人',
        packageDetails: '包裹详情',
        costBreakdown: '费用明细',
        total: '总计',
        created: '创建时间:',
        lastUpdated: '最后更新:',
        estDelivery: '预计送达:',
        delivered: '已送达:',
        currentLocation: '当前位置:',
        pickedUp: '已取件:',
        status: {
            pending: '待处理（需要保险）',
            picked_up: '已取件',
            in_transit: '运输中',
            out_for_delivery: '派送中',
            delivered: '已送达',
            exception: '异常'
        },
        messages: {
            pending: { title: '紧急：需要保险', text: '此货运需要保险才能处理。请立即联系我们。' },
            in_transit: { title: '包裹运输中', text: '您的包裹目前正在运输中。追踪更新将在其进展时提供。' },
            out_for_delivery: { title: '派送中 - 今天到达！', text: '您的包裹正在派送中，今天将到达。请确保有人可以接收。' },
            delivered: { title: '成功送达', text: '您的包裹已成功送达。感谢选择CargoWatch！' },
            picked_up: { title: '包裹已取件', text: '您的包裹已被取件，现在由我们保管。它将很快开始运输。' },
            exception: { title: '异常 - 需要处理', text: '您的货运出现异常。请立即联系我们的支持团队获取帮助。' }
        },
        footer: '这是由CargoWatch生成的正式收据'
    },
    ja: {
        header: 'プロフェッショナル配送サービス',
        receiptTitle: '配送レシート',
        trackingNumber: '追跡番号',
        shipmentInfo: '配送情報',
        sender: '送信者',
        recipient: '受取人',
        packageDetails: 'パッケージ詳細',
        costBreakdown: '費用内訳',
        total: '合計',
        created: '作成日時:',
        lastUpdated: '最終更新:',
        estDelivery: '予定配達:',
        delivered: '配達済み:',
        currentLocation: '現在地:',
        pickedUp: '集荷済み:',
        status: {
            pending: '保留中（保険必要）',
            picked_up: '集荷済み',
            in_transit: '輸送中',
            out_for_delivery: '配達中',
            delivered: '配達済み',
            exception: '例外'
        },
        messages: {
            pending: { title: '緊急：保険が必要', text: 'この配送は処理前に保険が必要です。すぐにご連絡ください。' },
            in_transit: { title: 'パッケージ輸送中', text: 'お客様のパッケージは現在輸送中です。進行に応じて追跡更新が利用可能になります。' },
            out_for_delivery: { title: '配達中 - 本日到着予定！', text: 'お客様のパッケージは配達中で、本日到着予定です。受取人がいることを確認してください。' },
            delivered: { title: '配達完了', text: 'お客様のパッケージは正常に配達されました。CargoWatchを選択いただきありがとうございます！' },
            picked_up: { title: 'パッケージ集荷済み', text: 'お客様のパッケージは集荷され、現在当社が保管しています。まもなく輸送が開始されます。' },
            exception: { title: '例外 - 対応が必要', text: 'お客様の配送で例外が発生しました。すぐにサポートチームにお問い合わせください。' }
        },
        footer: 'これはCargoWatchによって生成された正式なレシートです'
    },
    ru: {
        header: 'ПРОФЕССИОНАЛЬНЫЕ УСЛУГИ ДОСТАВКИ',
        receiptTitle: 'КВИТАНЦИЯ О ДОСТАВКЕ',
        trackingNumber: 'НОМЕР ОТСЛЕЖИВАНИЯ',
        shipmentInfo: 'ИНФОРМАЦИЯ О ДОСТАВКЕ',
        sender: 'ОТПРАВИТЕЛЬ',
        recipient: 'ПОЛУЧАТЕЛЬ',
        packageDetails: 'ДЕТАЛИ ПОСЫЛКИ',
        costBreakdown: 'РАСШИФРОВКА СТОИМОСТИ',
        total: 'ИТОГО',
        created: 'Создано:',
        lastUpdated: 'Последнее обновление:',
        estDelivery: 'Предполагаемая доставка:',
        delivered: 'Доставлено:',
        currentLocation: 'Текущее местоположение:',
        pickedUp: 'Забрано:',
        status: {
            pending: 'ОЖИДАНИЕ (требуется страховка)',
            picked_up: 'ЗАБРАНО',
            in_transit: 'В ПУТИ',
            out_for_delivery: 'НА ДОСТАВКЕ',
            delivered: 'ДОСТАВЛЕНО',
            exception: 'ИСКЛЮЧЕНИЕ'
        },
        messages: {
            pending: { title: 'СРОЧНО: Требуется страховка', text: 'Эта посылка требует страховки перед обработкой. Пожалуйста, свяжитесь с нами немедленно.' },
            in_transit: { title: 'Посылка в пути', text: 'Ваша посылка в настоящее время в пути. Обновления отслеживания будут доступны по мере её продвижения.' },
            out_for_delivery: { title: 'На доставке - Прибывает сегодня!', text: 'Ваша посылка на доставке и прибудет сегодня. Пожалуйста, убедитесь, что кто-то доступен для получения.' },
            delivered: { title: 'Успешно доставлено', text: 'Ваша посылка была успешно доставлена. Спасибо, что выбрали CargoWatch!' },
            picked_up: { title: 'Посылка забрана', text: 'Ваша посылка была забрана и теперь находится в нашем распоряжении. Она скоро начнёт движение.' },
            exception: { title: 'ИСКЛЮЧЕНИЕ - Требуется действие', text: 'Произошло исключение с вашей посылкой. Пожалуйста, немедленно свяжитесь с нашей службой поддержки для получения помощи.' }
        },
        footer: 'Это официальная квитанция, созданная CargoWatch'
    },
    ar: {
        header: 'خدمات الشحن المهنية',
        receiptTitle: 'إيصال الشحنة',
        trackingNumber: 'رقم التتبع',
        shipmentInfo: 'معلومات الشحنة',
        sender: 'المرسل',
        recipient: 'المستلم',
        packageDetails: 'تفاصيل الطرد',
        costBreakdown: 'تفصيل التكاليف',
        total: 'المجموع',
        created: 'تم الإنشاء:',
        lastUpdated: 'آخر تحديث:',
        estDelivery: 'التسليم المتوقع:',
        delivered: 'تم التسليم:',
        currentLocation: 'الموقع الحالي:',
        pickedUp: 'تم الاستلام:',
        status: {
            pending: 'قيد الانتظار (التأمين مطلوب)',
            picked_up: 'تم الاستلام',
            in_transit: 'في الطريق',
            out_for_delivery: 'في التسليم',
            delivered: 'تم التسليم',
            exception: 'استثناء'
        },
        messages: {
            pending: { title: 'عاجل: التأمين مطلوب', text: 'هذه الشحنة تتطلب التأمين قبل معالجتها. يرجى الاتصال بنا فوراً.' },
            in_transit: { title: 'الطرد في الطريق', text: 'طردك حالياً في الطريق. ستكون تحديثات التتبع متاحة مع تقدمه.' },
            out_for_delivery: { title: 'في التسليم - يصل اليوم!', text: 'طردك في التسليم وسيصل اليوم. يرجى التأكد من وجود شخص متاح لاستلامه.' },
            delivered: { title: 'تم التسليم بنجاح', text: 'تم تسليم طردك بنجاح. شكراً لاختيار CargoWatch!' },
            picked_up: { title: 'تم استلام الطرد', text: 'تم استلام طردك وهو الآن في حوزتنا. سيبدأ العبور قريباً.' },
            exception: { title: 'استثناء - إجراء مطلوب', text: 'حدث استثناء مع شحنتك. يرجى الاتصال بفريق الدعم لدينا فوراً للحصول على المساعدة.' }
        },
        footer: 'هذا إيصال رسمي تم إنشاؤه بواسطة CargoWatch'
    }
};

// Helper function to generate receipt PDF
async function generateReceiptPDF(shipment, outputPath, language = 'en') {
    return new Promise((resolve, reject) => {
        try {
            // Get translations for the selected language (fallback to English)
            const t = receiptTranslations[language] || receiptTranslations.en;
            
            // CRITICAL: Log shipment data at the very start of PDF generation
            console.log('🚨🚨🚨 [PDF GENERATION START] Shipment received:');
            console.log('🚨 Tracking ID:', shipment.trackingId);
            console.log('🚨 Language:', language);
            console.log('🚨 Full Cost object:', JSON.stringify(shipment.cost, null, 2));
            console.log('🚨 Cost.currency:', shipment.cost?.currency);
            console.log('🚨 Cost.currency type:', typeof shipment.cost?.currency);
            console.log('🚨 Cost.currency === "EUR":', shipment.cost?.currency === 'EUR');
            console.log('🚨 Package.currency:', shipment.package?.currency);
            console.log('🚨 Shipment type:', typeof shipment);
            console.log('🚨 Shipment is array?', Array.isArray(shipment));
            
            // IMMEDIATE CHECK: If cost.currency is EUR, log it loudly
            if (shipment.cost && shipment.cost.currency === 'EUR') {
                console.log('✅✅✅ CONFIRMED: Shipment has EUR in cost.currency!');
            } else {
                console.error('❌❌❌ PROBLEM: Shipment does NOT have EUR in cost.currency!');
                console.error('❌ Actual value:', shipment.cost?.currency);
            }
            
            const doc = new PDFDocument({ 
                margin: 50, 
                size: 'LETTER',
                info: {
                    Title: `Receipt - ${shipment.trackingId}`,
                    Author: 'CargoWatch',
                    Subject: 'Shipment Receipt'
                }
            });
            const stream = fsSync.createWriteStream(outputPath);
            doc.pipe(stream);

            // Define logo path at the beginning for use in header and footer
            const logoPath = path.join(__dirname, 'delivery-truck-logo.png');

            const formatDate = (dateString) => {
                if (!dateString) return 'N/A';
                const date = new Date(dateString);
                // Map language codes to locale strings
                const localeMap = {
                    'en': 'en-US',
                    'fr': 'fr-FR',
                    'es': 'es-ES',
                    'de': 'de-DE',
                    'pt': 'pt-PT',
                    'it': 'it-IT',
                    'zh': 'zh-CN',
                    'ja': 'ja-JP',
                    'ru': 'ru-RU',
                    'ar': 'ar-SA'
                };
                const locale = localeMap[language] || 'en-US';
                return date.toLocaleDateString(locale, { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
            };

            const getCurrencySymbol = (currencyCode) => {
                const symbols = {
                    'USD': '$', 'EUR': '€', 'GBP': '£', 'JPY': '¥', 'CNY': '¥',
                    'XAF': 'Fr', 'XOF': 'Fr', 'CAD': '$', 'AUD': '$', 'CHF': 'Fr',
                    'INR': '₹', 'BRL': 'R$', 'MXN': '$', 'RUB': '₽', 'ZAR': 'R',
                    'SGD': '$', 'HKD': '$', 'NZD': '$', 'SEK': 'kr', 'NOK': 'kr',
                    'DKK': 'kr', 'PLN': 'zł', 'TRY': '₺', 'THB': '฿', 'MYR': 'RM',
                    'IDR': 'Rp', 'PHP': '₱', 'VND': '₫', 'KRW': '₩', 'TWD': 'NT$',
                    'AED': 'د.إ', 'SAR': '﷼', 'ILS': '₪', 'EGP': '£', 'NGN': '₦',
                    'KES': 'KSh', 'ARS': '$', 'CLP': '$', 'COP': '$', 'PEN': 'S/.',
                    'PKR': '₨', 'BDT': '৳', 'LKR': 'Rs', 'CZK': 'Kč', 'HUF': 'Ft',
                    'RON': 'lei', 'BGN': 'лв', 'HRK': 'kn', 'BAM': 'КМ', 'RSD': 'дин',
                    'MKD': 'ден', 'ALL': 'L', 'ISK': 'kr', 'NOK': 'kr', 'DKK': 'kr'
                };
                const normalized = (currencyCode || '').toString().toUpperCase().trim();
                return symbols[normalized] || normalized;
            };
            
            // Get shipment currency (from cost or package, default to USD)
            // FORCE detection with multiple checks
            let shipmentCurrency = 'USD'; // Default
            
            // Method 1: Check cost.currency directly
            if (shipment.cost && shipment.cost.currency) {
                shipmentCurrency = shipment.cost.currency;
                console.log('✅ Method 1: Currency found in cost.currency:', shipmentCurrency);
            }
            
            // Method 2: Check package.currency if cost doesn't have it
            if (shipmentCurrency === 'USD' && shipment.package && shipment.package.currency) {
                shipmentCurrency = shipment.package.currency;
                console.log('✅ Method 2: Currency found in package.currency:', shipmentCurrency);
            }
            
            // Method 3: Check if cost object exists and has currency property
            if (shipmentCurrency === 'USD' && shipment.cost) {
                const costCurrency = shipment.cost.currency || shipment.cost.Currency || shipment.cost.CURRENCY;
                if (costCurrency) {
                    shipmentCurrency = costCurrency;
                    console.log('✅ Method 3: Currency found via alternative cost property:', shipmentCurrency);
                }
            }
            
            // Normalize currency code to uppercase
            shipmentCurrency = (shipmentCurrency || 'USD').toString().toUpperCase().trim();
            
            // FINAL VALIDATION: If we still have USD but shipment has EUR anywhere, FORCE EUR
            const hasEUR = (shipment.cost?.currency && shipment.cost.currency.toUpperCase() === 'EUR') ||
                          (shipment.package?.currency && shipment.package.currency.toUpperCase() === 'EUR') ||
                          (shipment.cost?.Currency && shipment.cost.Currency.toUpperCase() === 'EUR') ||
                          (shipment.package?.Currency && shipment.package.Currency.toUpperCase() === 'EUR');
            
            if (hasEUR && shipmentCurrency !== 'EUR') {
                console.error('🚨🚨🚨 CRITICAL: Shipment has EUR but shipmentCurrency is', shipmentCurrency);
                console.error('🚨 Cost.currency:', shipment.cost?.currency);
                console.error('🚨 Package.currency:', shipment.package?.currency);
                console.error('🚨 FORCING shipmentCurrency to EUR');
                shipmentCurrency = 'EUR';
            }
            
            console.log('📄 PDF Generation - FINAL Shipment Currency:', shipmentCurrency);
            console.log('📄 Cost object:', JSON.stringify(shipment.cost));
            console.log('📄 Cost currency:', shipment.cost?.currency);
            console.log('📄 Package currency:', shipment.package?.currency);
            console.log('📄 Has EUR check:', hasEUR);
            
            // CAPTURE shipment currency directly from shipment object for use in closure
            const capturedCostCurrency = shipment.cost?.currency;
            const capturedPackageCurrency = shipment.package?.currency;
            
            const formatCurrency = (amount, currencyCode) => {
                // ALWAYS check shipment.cost.currency DIRECTLY - don't rely on shipmentCurrency variable
                let currency = 'USD';
                
                // DIRECT CHECK: Read from shipment object every time
                if (shipment.cost && shipment.cost.currency) {
                    currency = shipment.cost.currency.toUpperCase().trim();
                    console.log(`💰 Direct read from shipment.cost.currency: ${currency}`);
                } else if (shipment.package && shipment.package.currency) {
                    currency = shipment.package.currency.toUpperCase().trim();
                    console.log(`💰 Direct read from shipment.package.currency: ${currency}`);
                } else if (capturedCostCurrency) {
                    currency = capturedCostCurrency.toUpperCase().trim();
                    console.log(`💰 Using captured cost currency: ${currency}`);
                } else if (capturedPackageCurrency) {
                    currency = capturedPackageCurrency.toUpperCase().trim();
                    console.log(`💰 Using captured package currency: ${currency}`);
                } else {
                    currency = shipmentCurrency || 'USD';
                    console.log(`💰 Fallback to shipmentCurrency: ${currency}`);
                }
                
                // FINAL FORCE: If ANY source says EUR, use EUR
                if (capturedCostCurrency && capturedCostCurrency.toUpperCase() === 'EUR') {
                    currency = 'EUR';
                    console.log(`💰 FORCED to EUR from capturedCostCurrency`);
                }
                if (capturedPackageCurrency && capturedPackageCurrency.toUpperCase() === 'EUR') {
                    currency = 'EUR';
                    console.log(`💰 FORCED to EUR from capturedPackageCurrency`);
                }
                if (shipment.cost?.currency && shipment.cost.currency.toUpperCase() === 'EUR') {
                    currency = 'EUR';
                    console.log(`💰 FORCED to EUR from direct shipment.cost.currency check`);
                }
                
                console.log(`💰 FINAL currency for ${amount}: ${currency}`);
                
                const symbol = getCurrencySymbol(currency);
                console.log(`💰 Symbol: ${symbol}`);
                
                const numAmount = parseFloat(amount || 0);
                const formattedAmount = numAmount.toFixed(2);
                
                // For currencies like JPY, no decimal places
                if (currency === 'JPY') {
                    return `${symbol}${Math.round(numAmount)}`;
                }
                
                // For EUR, use European format: €X,XX (comma as decimal separator)
                if (currency === 'EUR') {
                    const result = `${symbol}${formattedAmount.replace('.', ',')}`;
                    console.log(`💰✅ EUR result: ${result}`);
                    return result;
                }
                
                // Default format: $X.XX
                const result = `${symbol}${formattedAmount}`;
                console.log(`💰 Default result: ${result}`);
                return result;
            };

            const primaryColor = '#1e40af'; // Blue-800
            const secondaryColor = '#3b82f6'; // Blue-500
            const textColor = '#1f2937'; // Gray-800
            const lightGray = '#9ca3af'; // Gray-400

            // Draw header background
            doc.rect(0, 0, doc.page.width, 120)
               .fillColor('#1e40af')
               .fill();

            // Add logo in header
            let logoLoaded = false;
            try {
                if (fsSync.existsSync(logoPath)) {
                    doc.image(logoPath, 50, 25, { 
                        width: 60,
                        height: 60
                    });
                    logoLoaded = true;
                    // Header Content with logo
                    doc.fillColor('#ffffff')
                       .fontSize(36)
                       .font('Helvetica-Bold')
                       .text('CargoWatch', 120, 35, { align: 'left' });
                    
                doc.fillColor('#e0e7ff')
                   .fontSize(12)
                   .font('Helvetica')
                   .text(t.header, 120, 75);
                } else {
                    console.log('Logo file not found at:', logoPath);
                    // Fallback if logo doesn't exist
                    doc.fillColor('#ffffff')
                       .fontSize(36)
                       .font('Helvetica-Bold')
                       .text('CargoWatch', 50, 30, { align: 'left' });
                    
                    doc.fillColor('#e0e7ff')
                       .fontSize(12)
                       .font('Helvetica')
                       .text('PROFESSIONAL SHIPMENT SERVICES', 50, 75);
                }
            } catch (error) {
                // Fallback if logo can't be loaded
                console.error('Error loading logo for PDF header:', error);
                doc.fillColor('#ffffff')
                   .fontSize(36)
                   .font('Helvetica-Bold')
                   .text('CargoWatch', 50, 30, { align: 'left' });
                
                doc.fillColor('#e0e7ff')
                   .fontSize(12)
                   .font('Helvetica')
                   .text(t.header, 50, 75);
            }
            
            doc.fillColor('#ffffff')
               .fontSize(14)
               .font('Helvetica')
               .text(t.receiptTitle, doc.page.width - 250, 40, { align: 'right' });
            
            doc.moveDown(2);

            // Tracking ID Box
            const trackingY = 140;
            doc.roundedRect(50, trackingY, doc.page.width - 100, 50, 8)
               .fillColor('#eff6ff')
               .fill()
               .strokeColor(primaryColor)
               .lineWidth(2)
               .stroke();
            
            doc.fillColor(primaryColor)
               .fontSize(16)
               .font('Helvetica')
               .text(t.trackingNumber, 70, trackingY + 8);
            
            doc.fillColor('#000000')
               .fontSize(24)
               .font('Helvetica-Bold')
               .text(shipment.trackingId, 70, trackingY + 25);

            doc.y = trackingY + 70;

            // Shipment Information Section
            doc.moveDown(1);
            doc.fillColor(primaryColor)
               .fontSize(16)
               .font('Helvetica-Bold')
               .text(t.shipmentInfo, 50, doc.y);
            
            doc.moveDown(0.3);
            
            // Status badge with dynamic colors based on shipment status
            const shipmentStatus = shipment.status || 'pending';
            
            // Define status colors and text using translations
            let statusColor, statusText;
            
            switch(shipmentStatus) {
                case 'pending':
                    statusColor = '#dc2626'; // Red-600
                    statusText = t.status.pending;
                    break;
                case 'picked_up':
                    statusColor = '#6366f1'; // Indigo-500
                    statusText = t.status.picked_up;
                    break;
                case 'in_transit':
                    statusColor = '#3b82f6'; // Blue-500
                    statusText = t.status.in_transit;
                    break;
                case 'out_for_delivery':
                    statusColor = '#f59e0b'; // Amber-500
                    statusText = t.status.out_for_delivery;
                    break;
                case 'delivered':
                    statusColor = '#10b981'; // Emerald-500
                    statusText = t.status.delivered;
                    break;
                case 'exception':
                    statusColor = '#ef4444'; // Red-500
                    statusText = t.status.exception;
                    break;
                default:
                    statusColor = primaryColor; // Default blue
                    statusText = t.status.pending;
            }
            
            const statusWidth = doc.widthOfString(statusText, { font: 'Helvetica-Bold', fontSize: 12 }) + 30;
            
            doc.roundedRect(50, doc.y, statusWidth, 20, 4)
               .fillColor(statusColor)
               .fill();
            doc.fillColor('#ffffff')
               .fontSize(12)
               .font('Helvetica-Bold')
               .text(statusText, 60, doc.y + 5);
            
            doc.y += 30;
            
            // Information grid
            const infoY = doc.y;
            const colWidth = (doc.page.width - 100) / 2;
            
            doc.fillColor(textColor)
               .fontSize(10)
               .font('Helvetica')
               .text(t.created, 50, infoY, { width: colWidth - 20 });
            doc.font('Helvetica-Bold')
               .text(formatDate(shipment.createdAt), 50, infoY + 12, { width: colWidth - 20 });
            
            doc.font('Helvetica')
               .text(t.lastUpdated, colWidth, infoY, { width: colWidth - 20 });
            doc.font('Helvetica-Bold')
               .text(formatDate(shipment.updatedAt), colWidth, infoY + 12, { width: colWidth - 20 });
            
            doc.font('Helvetica')
               .text(t.estDelivery, 50, infoY + 28, { width: colWidth - 20 });
            doc.font('Helvetica-Bold')
               .text(formatDate(shipment.estimatedDelivery), 50, infoY + 40, { width: colWidth - 20 });

            // Add dynamic information based on status
            let statusInfoY = infoY + 50;
            if (shipmentStatus === 'delivered' && shipment.deliveredAt) {
                doc.font('Helvetica')
                   .fillColor(textColor)
                   .fontSize(10)
                   .text(t.delivered, colWidth, infoY + 28, { width: colWidth - 20 });
                doc.font('Helvetica-Bold')
                   .text(formatDate(shipment.deliveredAt), colWidth, infoY + 40, { width: colWidth - 20 });
                statusInfoY = infoY + 50;
            } else if (shipmentStatus === 'in_transit' && shipment.currentLocation?.city) {
                doc.font('Helvetica')
                   .fillColor(textColor)
                   .fontSize(10)
                   .text(t.currentLocation, colWidth, infoY + 28, { width: colWidth - 20 });
                doc.font('Helvetica-Bold')
                   .text(shipment.currentLocation.city, colWidth, infoY + 40, { width: colWidth - 20 });
                statusInfoY = infoY + 50;
            } else if (shipmentStatus === 'out_for_delivery') {
                doc.font('Helvetica')
                   .fillColor(textColor)
                   .fontSize(10)
                   .text(t.currentLocation, colWidth, infoY + 28, { width: colWidth - 20 });
                doc.font('Helvetica-Bold')
                   .text(shipment.currentLocation?.city || t.status.in_transit, colWidth, infoY + 40, { width: colWidth - 20 });
                statusInfoY = infoY + 50;
            } else if (shipmentStatus === 'picked_up') {
                const pickedUpEvent = shipment.events?.find(e => e.status === 'picked_up');
                if (pickedUpEvent) {
                    doc.font('Helvetica')
                       .fillColor(textColor)
                       .fontSize(10)
                       .text(t.pickedUp, colWidth, infoY + 28, { width: colWidth - 20 });
                    doc.font('Helvetica-Bold')
                       .text(formatDate(pickedUpEvent.timestamp), colWidth, infoY + 40, { width: colWidth - 20 });
                    statusInfoY = infoY + 50;
                }
            }

            doc.y = statusInfoY;
            
            // Add dynamic status-specific message box
            if (shipmentStatus === 'pending') {
                doc.moveDown(0.3);
                const messageY = doc.y;
                doc.roundedRect(50, messageY, doc.page.width - 100, 28, 6)
                   .fillColor('#fef2f2')
                   .fill()
                   .strokeColor('#dc2626')
                   .lineWidth(1.5)
                   .stroke();
                
                doc.fillColor('#dc2626')
                   .fontSize(11)
                   .font('Helvetica-Bold')
                   .text(t.messages.pending.title, 60, messageY + 6);
                
                doc.fillColor('#7f1d1d')
                   .fontSize(9)
                   .font('Helvetica')
                   .text(t.messages.pending.text, 60, messageY + 18, { width: doc.page.width - 140 });
                
                doc.y = messageY + 32;
            } else if (shipmentStatus === 'in_transit') {
                doc.moveDown(0.3);
                const messageY = doc.y;
                doc.roundedRect(50, messageY, doc.page.width - 100, 25, 6)
                   .fillColor('#eff6ff')
                   .fill()
                   .strokeColor('#3b82f6')
                   .lineWidth(1.5)
                   .stroke();
                
                doc.fillColor('#1e40af')
                   .fontSize(11)
                   .font('Helvetica-Bold')
                   .text(t.messages.in_transit.title, 60, messageY + 6);
                
                doc.fillColor('#1e3a8a')
                   .fontSize(9)
                   .font('Helvetica')
                   .text(t.messages.in_transit.text, 60, messageY + 18, { width: doc.page.width - 140 });
                
                doc.y = messageY + 29;
            } else if (shipmentStatus === 'out_for_delivery') {
                doc.moveDown(0.3);
                const messageY = doc.y;
                doc.roundedRect(50, messageY, doc.page.width - 100, 28, 6)
                   .fillColor('#fffbeb')
                   .fill()
                   .strokeColor('#f59e0b')
                   .lineWidth(1.5)
                   .stroke();
                
                doc.fillColor('#d97706')
                   .fontSize(11)
                   .font('Helvetica-Bold')
                   .text(t.messages.out_for_delivery.title, 60, messageY + 6);
                
                doc.fillColor('#92400e')
                   .fontSize(9)
                   .font('Helvetica')
                   .text(t.messages.out_for_delivery.text, 60, messageY + 18, { width: doc.page.width - 140 });
                
                doc.y = messageY + 32;
            } else if (shipmentStatus === 'delivered') {
                doc.moveDown(0.3);
                const messageY = doc.y;
                doc.roundedRect(50, messageY, doc.page.width - 100, 28, 6)
                   .fillColor('#ecfdf5')
                   .fill()
                   .strokeColor('#10b981')
                   .lineWidth(1.5)
                   .stroke();
                
                doc.fillColor('#047857')
                   .fontSize(11)
                   .font('Helvetica-Bold')
                   .text(t.messages.delivered.title, 60, messageY + 6);
                
                doc.fillColor('#065f46')
                   .fontSize(9)
                   .font('Helvetica')
                   .text(t.messages.delivered.text, 60, messageY + 18, { width: doc.page.width - 140 });
                
                doc.y = messageY + 32;
            } else if (shipmentStatus === 'picked_up') {
                doc.moveDown(0.3);
                const messageY = doc.y;
                doc.roundedRect(50, messageY, doc.page.width - 100, 25, 6)
                   .fillColor('#eef2ff')
                   .fill()
                   .strokeColor('#6366f1')
                   .lineWidth(1.5)
                   .stroke();
                
                doc.fillColor('#4338ca')
                   .fontSize(11)
                   .font('Helvetica-Bold')
                   .text(t.messages.picked_up.title, 60, messageY + 6);
                
                doc.fillColor('#312e81')
                   .fontSize(9)
                   .font('Helvetica')
                   .text(t.messages.picked_up.text, 60, messageY + 18, { width: doc.page.width - 140 });
                
                doc.y = messageY + 29;
            } else if (shipmentStatus === 'exception') {
                doc.moveDown(0.3);
                const messageY = doc.y;
                doc.roundedRect(50, messageY, doc.page.width - 100, 28, 6)
                   .fillColor('#fef2f2')
                   .fill()
                   .strokeColor('#ef4444')
                   .lineWidth(1.5)
                   .stroke();
                
                doc.fillColor('#dc2626')
                   .fontSize(11)
                   .font('Helvetica-Bold')
                   .text(t.messages.exception.title, 60, messageY + 6);
                
                doc.fillColor('#991b1b')
                   .fontSize(9)
                   .font('Helvetica')
                   .text(t.messages.exception.text, 60, messageY + 18, { width: doc.page.width - 140 });
                
                doc.y = messageY + 32;
            }

            // Sender and Recipient side by side
            const sectionY = doc.y;
            const sectionWidth = (doc.page.width - 120) / 2;

            // Sender Section
            doc.roundedRect(50, sectionY, sectionWidth, 150, 6)
               .fillColor('#f9fafb')
               .fill()
               .strokeColor(lightGray)
               .lineWidth(1)
               .stroke();
            
            doc.fillColor(primaryColor)
               .fontSize(14)
               .font('Helvetica-Bold')
               .text(t.sender, 60, sectionY + 10);
            
            doc.moveDown(0.3);
            doc.strokeColor(lightGray)
               .lineWidth(0.5)
               .moveTo(60, doc.y)
               .lineTo(50 + sectionWidth - 20, doc.y)
               .stroke();
            
            doc.moveDown(0.5);
            doc.fillColor(textColor)
               .fontSize(11)
               .font('Helvetica-Bold')
               .text(shipment.sender?.name || 'N/A', 60, doc.y);
            doc.y += 4;
            doc.fontSize(9)
               .font('Helvetica')
               .fillColor(lightGray)
               .text('Email:', 60, doc.y);
            doc.fillColor(textColor)
               .text(shipment.sender?.email || 'N/A', 60, doc.y + 10);
            doc.y += 2;
            doc.fillColor(lightGray)
               .text('Phone:', 60, doc.y);
            doc.fillColor(textColor)
               .text(shipment.sender?.phone || 'N/A', 60, doc.y + 10);
            doc.y += 2;
            doc.fillColor(lightGray)
               .text('Address:', 60, doc.y);
            const senderAddr = [
                shipment.sender?.address?.street,
                shipment.sender?.address?.city,
                shipment.sender?.address?.state,
                shipment.sender?.address?.zipCode
            ].filter(Boolean).join(', ');
            doc.fillColor(textColor)
               .text(senderAddr || 'N/A', 60, doc.y + 10, { width: sectionWidth - 30 });

            // Recipient Section
            const recipientX = 70 + sectionWidth;
            doc.roundedRect(recipientX, sectionY, sectionWidth, 150, 6)
               .fillColor('#f9fafb')
               .fill()
               .strokeColor(lightGray)
               .lineWidth(1)
               .stroke();
            
            doc.fillColor(primaryColor)
               .fontSize(14)
               .font('Helvetica-Bold')
               .text(t.recipient, recipientX + 10, sectionY + 10);
            
            doc.y = sectionY + 35;
            doc.strokeColor(lightGray)
               .lineWidth(0.5)
               .moveTo(recipientX + 10, doc.y)
               .lineTo(recipientX + sectionWidth - 20, doc.y)
               .stroke();
            
            doc.moveDown(0.5);
            doc.fillColor(textColor)
               .fontSize(11)
               .font('Helvetica-Bold')
               .text(shipment.recipient?.name || 'N/A', recipientX + 10, doc.y);
            doc.y += 4;
            doc.fontSize(9)
               .font('Helvetica')
               .fillColor(lightGray)
               .text('Email:', recipientX + 10, doc.y);
            doc.fillColor(textColor)
               .text(shipment.recipient?.email || 'N/A', recipientX + 10, doc.y + 10);
            doc.y += 2;
            doc.fillColor(lightGray)
               .text('Phone:', recipientX + 10, doc.y);
            doc.fillColor(textColor)
               .text(shipment.recipient?.phone || 'N/A', recipientX + 10, doc.y + 10);
            doc.y += 2;
            doc.fillColor(lightGray)
               .text('Address:', recipientX + 10, doc.y);
            const recipientAddr = [
                shipment.recipient?.address?.street,
                shipment.recipient?.address?.city,
                shipment.recipient?.address?.state,
                shipment.recipient?.address?.zipCode
            ].filter(Boolean).join(', ');
            doc.fillColor(textColor)
               .text(recipientAddr || 'N/A', recipientX + 10, doc.y + 10, { width: sectionWidth - 30 });

            doc.y = sectionY + 160;

            // Package Details Section
            doc.moveDown(0.5);
            doc.fillColor(primaryColor)
               .fontSize(16)
               .font('Helvetica-Bold')
               .text(t.packageDetails, 50, doc.y);
            
            doc.moveDown(0.3);
            
            doc.roundedRect(50, doc.y, doc.page.width - 100, 140, 6)
               .fillColor('#f9fafb')
               .fill()
               .strokeColor(lightGray)
               .lineWidth(1)
               .stroke();
            
            const pkgY = doc.y + 15;
            const pkgColWidth = (doc.page.width - 100) / 3;
            
            doc.fillColor(lightGray)
               .fontSize(9)
               .font('Helvetica')
               .text('Type', 60, pkgY);
            doc.fillColor(textColor)
               .fontSize(11)
               .font('Helvetica-Bold')
               .text((shipment.package?.type || 'N/A').toUpperCase(), 60, pkgY + 12);
            
            doc.fillColor(lightGray)
               .font('Helvetica')
               .text('Weight', 60 + pkgColWidth, pkgY);
            doc.fillColor(textColor)
               .font('Helvetica-Bold')
               .text(`${shipment.package?.weight || 'N/A'} lbs`, 60 + pkgColWidth, pkgY + 12);
            
            doc.fillColor(lightGray)
               .font('Helvetica')
               .text('Value', 60 + (pkgColWidth * 2), pkgY);
            doc.fillColor(textColor)
               .font('Helvetica-Bold')
               .text(formatCurrency(shipment.package?.value, shipmentCurrency), 60 + (pkgColWidth * 2), pkgY + 12);
            
            if (shipment.package?.dimensions) {
                doc.fillColor(lightGray)
                   .font('Helvetica')
                   .text('Dimensions', 60, pkgY + 35);
                doc.fillColor(textColor)
                   .font('Helvetica-Bold')
                   .text(`${shipment.package.dimensions.length}" × ${shipment.package.dimensions.width}" × ${shipment.package.dimensions.height}"`, 60, pkgY + 47);
            }
            
            if (shipment.package?.description) {
                doc.fillColor(lightGray)
                   .font('Helvetica')
                   .text('Description', 60, pkgY + 65);
                doc.fillColor(textColor)
                   .font('Helvetica-Bold')
                   .text(shipment.package.description, 60, pkgY + 77, { width: doc.page.width - 140 });
            }
            
            if (shipment.package?.vehicle?.make) {
                const vehicleInfo = `${shipment.package.vehicle.year || ''} ${shipment.package.vehicle.make || ''} ${shipment.package.vehicle.model || ''}`.trim();
                if (vehicleInfo) {
                    doc.fillColor(lightGray)
                       .font('Helvetica')
                       .text('Vehicle', 60, pkgY + (shipment.package?.description ? 95 : 65));
                    doc.fillColor(textColor)
                       .font('Helvetica-Bold')
                       .text(vehicleInfo, 60, pkgY + (shipment.package?.description ? 107 : 77));
                }
            }

            doc.y = pkgY + 140;

            // Cost Breakdown Section
            if (shipment.cost) {
                doc.moveDown(0.5);
                doc.fillColor(primaryColor)
                   .fontSize(16)
                   .font('Helvetica-Bold')
                   .text(t.costBreakdown, 50, doc.y);
                
                doc.moveDown(0.3);
                
                const costY = doc.y;
                const costTableWidth = doc.page.width - 100;
                const costCol1Width = costTableWidth * 0.7;
                const costCol2Width = costTableWidth * 0.3;
                
                // Table header
                doc.roundedRect(50, costY, costTableWidth, 25, 6)
                   .fillColor(primaryColor)
                   .fill();
                
                doc.fillColor('#ffffff')
                   .fontSize(11)
                   .font('Helvetica-Bold')
                   .text('Description', 60, costY + 8);
                doc.text('Amount', 50 + costCol1Width + 10, costY + 8, { align: 'right', width: costCol2Width - 20 });
                
                let currentY = costY + 30;
                
                // Base cost row
                doc.rect(50, currentY, costTableWidth, 25)
                   .fillColor('#ffffff')
                   .fill()
                   .strokeColor(lightGray)
                   .lineWidth(0.5)
                   .stroke();
                doc.fillColor(textColor)
                   .fontSize(10)
                   .font('Helvetica')
                   .text('Base Cost', 60, currentY + 8);
                const baseCostFormatted = formatCurrency(shipment.cost.base, shipmentCurrency);
                console.log('💰 [BASE COST] Amount:', shipment.cost.base, 'Formatted:', baseCostFormatted, 'shipmentCurrency:', shipmentCurrency);
                doc.font('Helvetica-Bold')
                   .text(baseCostFormatted, 50 + costCol1Width + 10, currentY + 8, { align: 'right', width: costCol2Width - 20 });
                
                currentY += 25;
                
                // Shipping row
                doc.rect(50, currentY, costTableWidth, 25)
                   .fillColor('#f9fafb')
                   .fill()
                   .strokeColor(lightGray)
                   .lineWidth(0.5)
                   .stroke();
                doc.fillColor(textColor)
                   .font('Helvetica')
                   .text('Shipping', 60, currentY + 8);
                const shippingFormatted = formatCurrency(shipment.cost.shipping, shipmentCurrency);
                console.log('💰 [SHIPPING] Amount:', shipment.cost.shipping, 'Formatted:', shippingFormatted, 'shipmentCurrency:', shipmentCurrency);
                doc.font('Helvetica-Bold')
                   .text(shippingFormatted, 50 + costCol1Width + 10, currentY + 8, { align: 'right', width: costCol2Width - 20 });
                
                if (shipment.cost.insurance) {
                    currentY += 25;
                    // Make insurance row taller to accommodate the note
                    doc.rect(50, currentY, costTableWidth, 40)
                       .fillColor('#ffffff')
                       .fill()
                       .strokeColor(lightGray)
                       .lineWidth(0.5)
                       .stroke();
                    doc.fillColor(textColor)
                       .font('Helvetica')
                       .text('Insurance', 60, currentY + 8);
                    const insuranceFormatted = formatCurrency(shipment.cost.insurance, shipmentCurrency);
                    console.log('💰 [INSURANCE] Amount:', shipment.cost.insurance, 'Formatted:', insuranceFormatted, 'shipmentCurrency:', shipmentCurrency);
                    doc.font('Helvetica-Bold')
                       .text(insuranceFormatted, 50 + costCol1Width + 10, currentY + 8, { align: 'right', width: costCol2Width - 20 });
                    // Add notice below insurance amount
                    doc.fillColor(lightGray)
                       .fontSize(8)
                       .font('Helvetica')
                       .text('Insurance needed - 100% refundable at delivery', 60, currentY + 22, { width: costCol1Width });
                    currentY += 15; // Adjust for the taller row
                }
                
                // Total row
                currentY += 25;
                doc.roundedRect(50, currentY, costTableWidth, 35, 6)
                   .fillColor('#eff6ff')
                   .fill()
                   .strokeColor(primaryColor)
                   .lineWidth(2)
                   .stroke();
                
                doc.fillColor(primaryColor)
                   .fontSize(14)
                   .font('Helvetica-Bold')
                   .text(t.total, 60, currentY + 10);
                const totalFormatted = formatCurrency(shipment.cost.total, shipmentCurrency);
                console.log('💰 [TOTAL] Amount:', shipment.cost.total, 'Formatted:', totalFormatted, 'shipmentCurrency:', shipmentCurrency);
                doc.fontSize(18)
                   .text(totalFormatted, 50 + costCol1Width + 10, currentY + 8, { align: 'right', width: costCol2Width - 20 });
                
                doc.y = currentY + 35;
            }

            // Footer
            doc.moveDown(1);
            const footerY = doc.y;
            doc.strokeColor(lightGray)
               .lineWidth(0.5)
               .moveTo(50, footerY)
               .lineTo(doc.page.width - 50, footerY)
               .stroke();
            
            doc.moveDown(0.5);
            
            // Add logo in footer
            const footerLogoY = doc.y;
            try {
                if (fsSync.existsSync(logoPath)) {
                    doc.image(logoPath, doc.page.width / 2 - 30, footerLogoY, { 
                        width: 40,
                        height: 40
                    });
                    doc.y = footerLogoY + 35;
                }
            } catch (error) {
                console.error('Error loading logo for PDF footer:', error);
            }
            
            doc.fillColor(lightGray)
               .fontSize(9)
               .font('Helvetica')
               .text(t.footer, { align: 'center' });
            
            // Display currency information
            doc.text(`All amounts displayed in ${shipmentCurrency} (${getCurrencySymbol(shipmentCurrency)})`, { align: 'center' });
            
            doc.text(`Generated on ${formatDate(new Date().toISOString())}`, { align: 'center' });
            doc.moveDown(0.3);
            doc.text('For questions or support, please contact our customer service team.', { align: 'center' });
            doc.text('www.cargowatch.com | support@cargowatch.com', { align: 'center' });

            doc.end();
            
            stream.on('finish', () => {
                resolve();
            });
            
            stream.on('error', (err) => {
                reject(err);
            });
        } catch (error) {
            reject(error);
        }
    });
}

// Helper function to generate receipt HTML (kept for reference)
function generateReceiptHTML(shipment) {
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount || 0);
    };

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Receipt - ${shipment.trackingId}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: #f5f5f5;
            padding: 40px 20px;
            color: #333;
        }
        .receipt-container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            border-radius: 8px;
            padding: 40px;
        }
        .header {
            text-align: center;
            border-bottom: 3px solid #2563eb;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .header h1 {
            color: #2563eb;
            font-size: 32px;
            margin-bottom: 10px;
        }
        .header p {
            color: #666;
            font-size: 14px;
        }
        .tracking-id {
            background: #f0f9ff;
            border: 2px solid #2563eb;
            padding: 15px;
            border-radius: 8px;
            text-align: center;
            margin-bottom: 30px;
        }
        .tracking-id strong {
            font-size: 24px;
            color: #2563eb;
            letter-spacing: 2px;
        }
        .section {
            margin-bottom: 30px;
        }
        .section h2 {
            color: #2563eb;
            font-size: 18px;
            margin-bottom: 15px;
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 10px;
        }
        .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 20px;
        }
        .info-item {
            padding: 15px;
            background: #f9fafb;
            border-radius: 6px;
        }
        .info-item label {
            font-size: 12px;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            display: block;
            margin-bottom: 5px;
        }
        .info-item .value {
            font-size: 16px;
            color: #111827;
            font-weight: 500;
        }
        .package-details {
            background: #f9fafb;
            padding: 20px;
            border-radius: 6px;
            margin-bottom: 20px;
        }
        .costs {
            background: #f0f9ff;
            padding: 20px;
            border-radius: 6px;
            margin-top: 20px;
        }
        .cost-row {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            border-bottom: 1px solid #e5e7eb;
        }
        .cost-row.total {
            border-top: 2px solid #2563eb;
            border-bottom: none;
            margin-top: 10px;
            padding-top: 15px;
            font-size: 20px;
            font-weight: bold;
            color: #2563eb;
        }
        .status-badge {
            display: inline-block;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 600;
            text-transform: uppercase;
        }
        .status-pending { background: #fef3c7; color: #92400e; }
        .status-in_transit { background: #dbeafe; color: #1e40af; }
        .status-delivered { background: #d1fae5; color: #065f46; }
        .status-picked_up { background: #e0e7ff; color: #3730a3; }
        .status-out_for_delivery { background: #fce7f3; color: #9f1239; }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #e5e7eb;
            text-align: center;
            color: #6b7280;
            font-size: 12px;
        }
        @media print {
            body { background: white; padding: 0; }
            .receipt-container { box-shadow: none; }
        }
    </style>
</head>
<body>
    <div class="receipt-container">
        <div class="header">
            <h1>CargoWatch</h1>
            <p>Shipment Receipt</p>
        </div>

        <div class="tracking-id">
            <strong>${shipment.trackingId}</strong>
        </div>

        <div class="section">
            <h2>Shipment Information</h2>
            <div class="info-grid">
                <div class="info-item">
                    <label>Status</label>
                    <span class="value">
                        <span class="status-badge status-${shipment.status || 'pending'}">
                            ${(shipment.status || 'pending').replace('_', ' ')}
                        </span>
                    </span>
                </div>
                <div class="info-item">
                    <label>Created Date</label>
                    <span class="value">${formatDate(shipment.createdAt)}</span>
                </div>
                <div class="info-item">
                    <label>Last Updated</label>
                    <span class="value">${formatDate(shipment.updatedAt)}</span>
                </div>
                <div class="info-item">
                    <label>Estimated Delivery</label>
                    <span class="value">${formatDate(shipment.estimatedDelivery)}</span>
                </div>
            </div>
        </div>

        <div class="section">
            <h2>Sender Information</h2>
            <div class="info-grid">
                <div class="info-item">
                    <label>Name</label>
                    <span class="value">${shipment.sender?.name || 'N/A'}</span>
                </div>
                <div class="info-item">
                    <label>Email</label>
                    <span class="value">${shipment.sender?.email || 'N/A'}</span>
                </div>
                <div class="info-item">
                    <label>Phone</label>
                    <span class="value">${shipment.sender?.phone || 'N/A'}</span>
                </div>
                <div class="info-item">
                    <label>Address</label>
                    <span class="value">
                        ${[shipment.sender?.address?.street, shipment.sender?.address?.city, shipment.sender?.address?.state, shipment.sender?.address?.zipCode, shipment.sender?.address?.country].filter(Boolean).join(', ')}
                    </span>
                </div>
            </div>
        </div>

        <div class="section">
            <h2>Recipient Information</h2>
            <div class="info-grid">
                <div class="info-item">
                    <label>Name</label>
                    <span class="value">${shipment.recipient?.name || 'N/A'}</span>
                </div>
                <div class="info-item">
                    <label>Email</label>
                    <span class="value">${shipment.recipient?.email || 'N/A'}</span>
                </div>
                <div class="info-item">
                    <label>Phone</label>
                    <span class="value">${shipment.recipient?.phone || 'N/A'}</span>
                </div>
                <div class="info-item">
                    <label>Address</label>
                    <span class="value">
                        ${[shipment.recipient?.address?.street, shipment.recipient?.address?.city, shipment.recipient?.address?.state, shipment.recipient?.address?.zipCode, shipment.recipient?.address?.country].filter(Boolean).join(', ')}
                    </span>
                </div>
            </div>
        </div>

        <div class="section">
            <h2>Package Details</h2>
            <div class="package-details">
                <div class="info-grid">
                    <div class="info-item">
                        <label>Type</label>
                        <span class="value">${shipment.package?.type || 'N/A'}</span>
                    </div>
                    <div class="info-item">
                        <label>Weight</label>
                        <span class="value">${shipment.package?.weight || 'N/A'} lbs</span>
                    </div>
                    <div class="info-item">
                        <label>Dimensions</label>
                        <span class="value">
                            ${shipment.package?.dimensions ? 
                                `${shipment.package.dimensions.length}" × ${shipment.package.dimensions.width}" × ${shipment.package.dimensions.height}"` 
                                : 'N/A'}
                        </span>
                    </div>
                    <div class="info-item">
                        <label>Value</label>
                        <span class="value">${formatCurrency(shipment.package?.value, shipment.package?.currency || shipment.cost?.currency || 'USD')}</span>
                    </div>
                </div>
                ${shipment.package?.description ? `
                <div style="margin-top: 15px;">
                    <label style="font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Description</label>
                    <p style="margin-top: 5px; color: #111827;">${shipment.package.description}</p>
                </div>
                ` : ''}
            </div>
        </div>

        ${shipment.cost ? `
        <div class="section">
            <h2>Cost Breakdown</h2>
            <div class="costs">
                <div class="cost-row">
                    <span>Base Cost</span>
                    <span>${formatCurrency(shipment.cost.base, shipment.cost?.currency || 'USD')}</span>
                </div>
                <div class="cost-row">
                    <span>Shipping</span>
                    <span>${formatCurrency(shipment.cost.shipping, shipment.cost?.currency || 'USD')}</span>
                </div>
                ${shipment.cost.insurance ? `
                <div class="cost-row">
                    <span>Insurance</span>
                    <span>${formatCurrency(shipment.cost.insurance, shipment.cost?.currency || 'USD')}</span>
                </div>
                ` : ''}
                <div class="cost-row total">
                    <span>Total</span>
                    <span>${formatCurrency(shipment.cost.total, shipment.cost?.currency || 'USD')}</span>
                </div>
            </div>
        </div>
        ` : ''}

        <div class="footer">
            <p>This is an official receipt generated by CargoWatch</p>
            <p>Generated on ${formatDate(new Date().toISOString())}</p>
            <p style="margin-top: 10px;">For questions or support, please contact our customer service team.</p>
        </div>
    </div>
</body>
</html>`;
}

// Get all receipts for download
app.get('/api/receipts', requireAuth, requireAdmin, async (req, res) => {
    try {
        const shipments = await readShipments();
        const receipts = shipments
            .filter(s => s.receipt)
            .map(s => ({
                trackingId: s.trackingId,
                receipt: s.receipt,
                receiptUploadedAt: s.receiptUploadedAt,
                recipientName: s.recipient?.name || 'Unknown',
                createdAt: s.createdAt
            }));
        res.json({ receipts });
    } catch (error) {
        console.error('Error fetching receipts:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/shipments', requireAuth, requireAdmin, async (req, res) => {
    try {
        const shipments = await readShipments();
        console.log(`📋 Admin shipments list requested: ${shipments.length} total shipments`);
        const limit = parseInt(req.query.limit) || 50;
        const offset = parseInt(req.query.offset) || 0;
        const paginatedShipments = shipments.slice(offset, offset + limit);
        res.json({ shipments: paginatedShipments, total: shipments.length, limit, offset });
    } catch (error) {
        console.error('Error fetching shipments:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ==================== CHAT API ROUTES ====================

app.post('/api/chat/start', async (req, res) => {
    try {
        const { clientName, clientEmail, subject, trackingId } = req.body;
        if (!clientName || !clientEmail) {
            return res.status(400).json({ error: 'Name and email are required' });
        }
        const chats = await readChats();
        const existingChat = chats.find(c => 
            c.clientEmail === clientEmail && (c.status === 'open' || c.status === 'active')
        );
        if (existingChat) {
            return res.json(existingChat);
        }
        const newChat = {
            id: uuidv4(),
            clientName,
            clientEmail,
            subject: subject || 'General Inquiry',
            trackingId: trackingId || null,
            status: 'open',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            messages: [],
            assignedTo: null
        };
        chats.push(newChat);
        await writeChats(chats);
        io.emit('new-chat', newChat); // Notify all admins about new chat
        res.status(201).json(newChat);
    } catch (error) {
        console.error('Error starting chat:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/chat/:chatId', async (req, res) => {
    try {
        const { chatId } = req.params;
        const chats = await readChats();
        const chat = chats.find(c => c.id === chatId);
        if (!chat) {
            return res.status(404).json({ error: 'Chat not found' });
        }
        res.json(chat);
    } catch (error) {
        console.error('Error fetching chat:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/chat/:chatId/message', async (req, res) => {
    try {
        const { chatId } = req.params;
        const { text, image, senderType, senderName } = req.body;
        if (!text) {
            return res.status(400).json({ error: 'Message text is required' });
        }
        const chats = await readChats();
        const chatIndex = chats.findIndex(c => c.id === chatId);
        if (chatIndex === -1) {
            return res.status(404).json({ error: 'Chat not found' });
        }
        const chat = chats[chatIndex];
        const message = {
            id: uuidv4(),
            text: text || '',
            image: null, // Images removed
            senderType: senderType || 'client',
            senderName: senderName || (senderType === 'admin' ? 'Admin' : chat.clientName),
            timestamp: new Date().toISOString(),
            read: false
        };
        chat.messages.push(message);
        chat.updatedAt = new Date().toISOString();
        chat.status = chat.status === 'open' ? 'active' : chat.status;
        await writeChats(chats);
        // Emit to all users in the specific chat room (clients and admins viewing this chat)
        io.to(`chat-${chatId}`).emit('new-message', { chatId, message });
        // Also emit to admin room for dashboard updates (admins must join this room)
        io.to('admins').emit('new-message', { chatId, message });
        res.json(message);
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/chat', requireAuth, requireAdmin, async (req, res) => {
    try {
        const chats = await readChats();
        const { status } = req.query;
        let filteredChats = chats;
        if (status) {
            filteredChats = chats.filter(c => c.status === status);
        }
        filteredChats.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        res.json(filteredChats);
    } catch (error) {
        console.error('Error fetching chats:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.put('/api/chat/:chatId/assign', requireAuth, requireAdmin, async (req, res) => {
    try {
        const { chatId } = req.params;
        const { adminId } = req.body;
        const chats = await readChats();
        const chatIndex = chats.findIndex(c => c.id === chatId);
        if (chatIndex === -1) {
            return res.status(404).json({ error: 'Chat not found' });
        }
        chats[chatIndex].assignedTo = adminId || req.session.userId;
        chats[chatIndex].status = 'active';
        chats[chatIndex].updatedAt = new Date().toISOString();
        await writeChats(chats);
        io.emit('chat-assigned', { chatId, adminId: chats[chatIndex].assignedTo });
        res.json(chats[chatIndex]);
    } catch (error) {
        console.error('Error assigning chat:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.put('/api/chat/:chatId/close', requireAuth, requireAdmin, async (req, res) => {
    try {
        const { chatId } = req.params;
        const chats = await readChats();
        const chatIndex = chats.findIndex(c => c.id === chatId);
        if (chatIndex === -1) {
            return res.status(404).json({ error: 'Chat not found' });
        }
        chats[chatIndex].status = 'closed';
        chats[chatIndex].updatedAt = new Date().toISOString();
        await writeChats(chats);
        io.emit('chat-closed', { chatId });
        res.json(chats[chatIndex]);
    } catch (error) {
        console.error('Error closing chat:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Mark messages as read when admin opens a chat
app.put('/api/chat/:chatId/read', requireAuth, requireAdmin, async (req, res) => {
    try {
        const { chatId } = req.params;
        const chats = await readChats();
        const chatIndex = chats.findIndex(c => c.id === chatId);
        if (chatIndex === -1) {
            return res.status(404).json({ error: 'Chat not found' });
        }
        
        // Mark all client messages as read
        let updated = false;
        chats[chatIndex].messages.forEach(message => {
            if (message.senderType === 'client' && !message.read) {
                message.read = true;
                updated = true;
            }
        });
        
        if (updated) {
            chats[chatIndex].updatedAt = new Date().toISOString();
            await writeChats(chats);
        }
        
        res.json({ success: true, unreadCount: chats[chatIndex].messages.filter(m => !m.read && m.senderType === 'client').length });
    } catch (error) {
        console.error('Error marking messages as read:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Socket.io connection handling
io.on('connection', (socket) => {
    console.log('👤 User connected:', socket.id);
    
    socket.on('join-chat', (chatId) => {
        socket.join(`chat-${chatId}`);
        console.log(`💬 User ${socket.id} joined chat ${chatId}`);
    });
    
    socket.on('leave-chat', (chatId) => {
        socket.leave(`chat-${chatId}`);
        console.log(`👋 User ${socket.id} left chat ${chatId}`);
    });
    
    socket.on('join-admins', () => {
        socket.join('admins');
        console.log(`👑 Admin ${socket.id} joined admin room`);
    });
    
    socket.on('leave-admins', () => {
        socket.leave('admins');
        console.log(`👋 Admin ${socket.id} left admin room`);
    });
    
    socket.on('disconnect', () => {
        console.log('👋 User disconnected:', socket.id);
    });
});

// Pages publiques qui ne nécessitent pas d'authentification
const publicPages = ['admin_login', 'public_tracking_interface', 'homepage', 'shipment_creation_portal', 'support_hub'];

// Middleware pour vérifier l'authentification sur les pages principales
function requirePageAuth(req, res, next) {
    const page = req.params.page;
    const pageName = page.replace(/\.html$/, '');
    
    // Si la page est publique, laisser passer
    if (publicPages.includes(pageName)) {
        return next();
    }
    
    // Pour les pages admin, vérifier l'authentification admin
    if (pageName.includes('admin')) {
        if (req.session && req.session.userId && req.session.role === 'admin') {
            return next();
        }
        res.redirect('/pages/admin_login.html');
        return;
    }
    
    // Pour les autres pages, laisser passer (pas d'authentification requise)
    return next();
}

// Routes pour servir les pages avec authentification obligatoire
app.get('/pages/:page', requirePageAuth, (req, res) => {
    const page = req.params.page;
    const pageName = page.replace(/\.html$/, '');
    const filePath = path.join(__dirname, 'pages', `${pageName}.html`);
    res.sendFile(filePath, (err) => {
        if (err) {
            console.error('Error serving file:', err);
            res.status(404).send('Page not found');
        }
    });
});

app.get('/', (req, res) => {
    // Rediriger vers la page publique de tracking
    res.redirect('/pages/public_tracking_interface.html');
});

// Serve receipts directory with proper PDF Content-Type
app.use('/receipts', (req, res, next) => {
    if (req.path.endsWith('.pdf')) {
        res.type('application/pdf');
    }
    express.static(path.join(__dirname, 'public', 'receipts'))(req, res, next);
});

app.use(express.static(__dirname));

app.use('/api/*', (req, res) => {
    res.status(404).json({ error: 'API endpoint not found' });
});

// Démarrer le serveur
async function startServer() {
    await ensureDataDir();

    if (process.env.MONGODB_URI) {
        try {
            await dbModule.connect();
            USE_MONGO = true;
            console.log('📦 Using MongoDB');
            // Migrer les données JSON vers MongoDB si les collections sont vides
            const usersCol = dbModule.getCollection('users');
            const shipmentsCol = dbModule.getCollection('shipments');
            const usersCount = await usersCol.countDocuments();
            const shipmentsCount = await shipmentsCol.countDocuments();
            if (usersCount === 0 || shipmentsCount === 0) {
                const users = await fs.readFile(USERS_FILE, 'utf8').then(d => JSON.parse(d)).catch(() => []);
                const shipments = await fs.readFile(SHIPMENTS_FILE, 'utf8').then(d => JSON.parse(d)).catch(() => []);
                const chats = await fs.readFile(CHATS_FILE, 'utf8').then(d => JSON.parse(d)).catch(() => []);
                const reviews = await fs.readFile(REVIEWS_FILE, 'utf8').then(d => JSON.parse(d)).catch(() => []);
                if (users.length && usersCount === 0) { await usersCol.insertMany(users); console.log(`📥 Migré ${users.length} utilisateur(s)`); }
                if (shipments.length && shipmentsCount === 0) { await shipmentsCol.insertMany(shipments); console.log(`📥 Migré ${shipments.length} expédition(s)`); }
                if (chats.length && (await dbModule.getCollection('chats').countDocuments()) === 0) { await dbModule.getCollection('chats').insertMany(chats); }
                if (Array.isArray(reviews) && reviews.length && (await dbModule.getCollection('reviews').countDocuments()) === 0) { await dbModule.getCollection('reviews').insertMany(reviews); }
            }
        } catch (err) {
            console.error('❌ MongoDB connection failed:', err.message);
            console.log('📄 Falling back to JSON file storage');
        }
    } else {
        console.log('📄 Using JSON file storage (set MONGODB_URI for MongoDB)');
    }

    server.listen(PORT, () => {
        console.log(`🚀 CargoWatch Server running on http://localhost:${PORT}`);
        console.log(`📡 API available at http://localhost:${PORT}/api`);
        console.log(`💬 Chat system enabled (Socket.io)`);
        console.log(`📁 Data: ${USE_MONGO ? 'MongoDB' : DATA_DIR}`);
        
        setInterval(async () => {
            try {
                const shipments = await readShipments();
                const updatedShipments = [];
                for (const shipment of shipments) {
                    if (shipment.autoProgress?.enabled && !shipment.autoProgress?.paused && 
                        shipment.status !== 'delivered' && shipment.status !== 'pending' &&
                        shipment.sender?.address?.lat && shipment.recipient?.address?.lat &&
                        shipment.estimatedDelivery) {
                        const autoPos = await calculateAutomaticProgression(shipment);
                        if (autoPos) {
                            const oldCity = shipment.currentLocation?.city || 'Unknown';
                            shipment.currentLocation = {
                                lat: autoPos.lat,
                                lng: autoPos.lng,
                                city: autoPos.city
                            };
                            shipment.autoProgress.lastUpdate = new Date().toISOString();
                            shipment.updatedAt = new Date().toISOString();
                            if (oldCity !== autoPos.city) {
                                console.log(`📍 ${shipment.trackingId}: ${oldCity} → ${autoPos.city} (${(autoPos.progress * 100).toFixed(1)}%)`);
                            }
                            updatedShipments.push(shipment);
                        }
                    }
                }
                if (updatedShipments.length > 0) {
                    // Update in database (JSON files)
                    await writeShipments(shipments);
                    console.log(`📍 Updated ${updatedShipments.length} shipment positions automatically`);
                }
            } catch (error) {
                console.error('Error in automatic position update:', error);
            }
        }, 10000);
    });
}

startServer().catch(console.error);

