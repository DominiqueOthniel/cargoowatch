/**
 * Script pour forcer un shipment en statut "in_transit" et démarrer l'auto-progression
 * Usage: node set-shipment-in-transit.js <TRACKING_ID>
 */

require('dotenv').config();
const { v4: uuidv4 } = require('uuid');
const fs = require('fs').promises;
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
const SHIPMENTS_FILE = path.join(DATA_DIR, 'shipments.json');

async function readShipments() {
    try {
        const data = await fs.readFile(SHIPMENTS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            return [];
        }
        throw error;
    }
}

async function writeShipments(shipments) {
    await fs.writeFile(SHIPMENTS_FILE, JSON.stringify(shipments, null, 2));
}

async function setInTransit(trackingId) {
    const normalizedId = trackingId.trim().toUpperCase();
    const shipments = await readShipments();
    const shipment = shipments.find(s => s.trackingId === normalizedId);
    if (!shipment) {
        throw new Error(`Shipment ${normalizedId} introuvable dans la base de données`);
    }

    const now = new Date().toISOString();
    shipment.status = 'in_transit';
    shipment.updatedAt = now;

    // Préparer autoProgress
    shipment.autoProgress = shipment.autoProgress || {};
    shipment.autoProgress.enabled = true;
    shipment.autoProgress.paused = false;
    shipment.autoProgress.pausedAt = null;
    shipment.autoProgress.pauseReason = null;
    shipment.autoProgress.pausedDuration = shipment.autoProgress.pausedDuration || 0;
    shipment.autoProgress.startedAt = shipment.autoProgress.startedAt || now;
    shipment.autoProgress.lastUpdate = now;

    // Ajouter un évènement "in_transit"
    shipment.events = shipment.events || [];
    shipment.events.forEach(event => {
        event.completed = true;
        event.current = false;
    });
    shipment.events.push({
        id: uuidv4(),
        status: 'in_transit',
        title: 'Shipment In Transit',
        description: 'Shipment forced into transit for testing',
        location: shipment.currentLocation?.city || shipment.sender?.address?.city || 'In Transit',
        timestamp: now,
        completed: false,
        current: true
    });

    // S'assurer qu'une localisation courante existe
    if (!shipment.currentLocation || !shipment.currentLocation.lat || !shipment.currentLocation.lng) {
        if (shipment.sender?.address?.lat && shipment.recipient?.address?.lat) {
            shipment.currentLocation = {
                lat: shipment.sender.address.lat,
                lng: shipment.sender.address.lng,
                city: shipment.sender.address.city || 'Origin'
            };
        }
    }

    // Trouver l'index du shipment dans le tableau
    const shipmentIndex = shipments.findIndex(s => s.trackingId === normalizedId);
    if (shipmentIndex === -1) {
        throw new Error(`Shipment ${normalizedId} introuvable`);
    }
    
    // Mettre à jour le shipment
    shipments[shipmentIndex] = shipment;
    await writeShipments(shipments);

    console.log(`✅ Shipment ${normalizedId} mis à jour en "in_transit" et auto-progression démarrée.`);
}

if (require.main === module) {
    const trackingId = process.argv[2];
    if (!trackingId) {
        console.error('Usage: node set-shipment-in-transit.js <TRACKING_ID>');
        process.exit(1);
    }

    setInTransit(trackingId)
        .then(() => process.exit(0))
        .catch(err => {
            console.error('❌ Erreur:', err.message);
            process.exit(1);
        });
}

module.exports = { setInTransit };