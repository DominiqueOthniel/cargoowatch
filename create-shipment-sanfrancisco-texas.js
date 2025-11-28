/**
 * Script pour créer un shipment de San Francisco vers Fort Worth, Texas
 * Expéditeur: MrJacob's Cars
 * Destinataire: Djana Campbell
 * Véhicule: 2019 Nissan Altima SL Grey
 * 
 * Usage:
 *   node create-shipment-sanfrancisco-texas.js
 *   node create-shipment-sanfrancisco-texas.js "2024-12-15T13:00:00Z"
 * 
 * Variables d'environnement:
 *   RENDER_URL=https://votre-app.onrender.com
 *   DELIVERY_DATE=2024-12-15T13:00:00Z
 */

require('dotenv').config();
const https = require('https');
const http = require('http');
const { URL } = require('url');

/**
 * Parse une date depuis différents formats
 */
function parseDeliveryDate(dateString) {
    if (!dateString) return null;
    
    try {
        // Si c'est un timestamp numérique
        if (/^\d+$/.test(dateString)) {
            return new Date(parseInt(dateString)).toISOString();
        }
        
        // Si c'est une date simple (YYYY-MM-DD), ajouter l'heure
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
            return new Date(dateString + 'T12:00:00Z').toISOString();
        }
        
        // Sinon, essayer de parser directement
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
            throw new Error('Date invalide');
        }
        return date.toISOString();
    } catch (error) {
        console.error(`⚠️  Erreur lors du parsing de la date "${dateString}": ${error.message}`);
        return null;
    }
}

/**
 * Récupère la date de livraison depuis les arguments ou l'environnement
 */
function getDeliveryDate() {
    // 1. Vérifier les arguments de ligne de commande
    const args = process.argv.slice(2);
    if (args.length > 0) {
        const dateFromArgs = parseDeliveryDate(args[0]);
        if (dateFromArgs) {
            return dateFromArgs;
        }
    }
    
    // 2. Vérifier la variable d'environnement
    if (process.env.DELIVERY_DATE) {
        const dateFromEnv = parseDeliveryDate(process.env.DELIVERY_DATE);
        if (dateFromEnv) {
            return dateFromEnv;
        }
    }
    
    return null;
}

const deliveryDate = getDeliveryDate();

// Calculer la date de départ pour 1pm (13:00) aujourd'hui
const departureDate = new Date();
departureDate.setHours(13, 0, 0, 0); // 1pm
if (departureDate < new Date()) {
    // Si 1pm est déjà passé aujourd'hui, utiliser demain
    departureDate.setDate(departureDate.getDate() + 1);
}

const shipmentData = {
    sender: {
        name: "MrJacob's Cars",
        email: "mrjacobs@cars.com",
        phone: "+1503426891",
        address: {
            street: "123 Market Street",
            city: "San Francisco",
            state: "California",
            zipCode: "94102",
            country: "US"
        }
    },
    recipient: {
        name: "Djana Campbell",
        email: "djanacampbell@me.com",
        phone: "630-863-0168",
        address: {
            street: "6004 Monta Vista Lane Apt 237",
            city: "Fort Worth",
            state: "Texas",
            zipCode: "76132",
            country: "US"
        }
    },
    package: {
        type: "vehicle",
        weight: 3200, // Poids approximatif d'une Nissan Altima
        dimensions: {
            length: 192.9,
            width: 72.9,
            height: 57.9
        },
        description: "2019 Nissan Altima SL Grey",
        value: 3400.00,
        currency: "USD",
        vehicle: {
            make: "Nissan",
            model: "Altima",
            year: 2019,
            trim: "SL",
            color: "Grey",
            vin: "", // VIN non fourni
            mileage: 0
        }
    },
    service: {
        type: "standard",
        priority: "normal",
        insurance: true
    },
    cost: {
        base: 0.00,
        shipping: 0.00,
        insurance: 300.00,
        currency: "USD"
    }
};

// Ajouter la date de livraison si fournie
if (deliveryDate) {
    shipmentData.estimatedDelivery = deliveryDate;
}

function createShipment() {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify(shipmentData);
        
        // Use RENDER_URL from environment or default to localhost
        const serverUrl = process.env.RENDER_URL || 'http://localhost:3000';
        const url = new URL(`${serverUrl}/api/shipments`);
        
        const isHttps = url.protocol === 'https:';
        const client = isHttps ? https : http;
        
        const options = {
            hostname: url.hostname,
            port: url.port || (isHttps ? 443 : 80),
            path: url.pathname,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        console.log('📦 Création d\'un nouveau shipment...');
        console.log(`🌐 Serveur: ${serverUrl}`);
        console.log('De: San Francisco, California → Vers: Fort Worth, Texas');
        console.log('Expéditeur: MrJacob\'s Cars');
        console.log('Destinataire: Djana Campbell');
        console.log('Véhicule: 2019 Nissan Altima SL Grey');
        console.log(`📅 Date de départ prévue: ${departureDate.toLocaleString('fr-FR', { timeZone: 'UTC' })} UTC`);
        if (deliveryDate) {
            console.log(`📅 Date de livraison spécifiée: ${new Date(deliveryDate).toLocaleString('fr-FR', { timeZone: 'UTC' })} UTC`);
        } else {
            console.log('📅 Date de livraison: sera calculée automatiquement par le serveur');
        }
        console.log('Données:', JSON.stringify(shipmentData, null, 2));

        const req = client.request(options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        const shipment = JSON.parse(data);
                        console.log('✅ Shipment créé avec succès!');
                        console.log('📋 Détails:');
                        console.log(`   Tracking ID: ${shipment.trackingId}`);
                        console.log(`   Statut: ${shipment.status}`);
                        console.log(`   Expéditeur: ${shipment.sender.name}`);
                        console.log(`   Destinataire: ${shipment.recipient.name}`);
                        console.log(`   Adresse: ${shipment.recipient.address.street}, ${shipment.recipient.address.city}, ${shipment.recipient.address.state} ${shipment.recipient.address.zipCode}`);
                        console.log(`   Véhicule: ${shipment.package.vehicle?.year || ''} ${shipment.package.vehicle?.make || ''} ${shipment.package.vehicle?.model || ''} ${shipment.package.vehicle?.trim || ''} ${shipment.package.vehicle?.color || ''}`);
                        const currency = shipment.cost?.currency || shipment.package?.currency || 'USD';
                        console.log(`   Coût total: ${currency} ${shipment.cost.total}`);
                        console.log(`   Frais d'expédition: ${currency} ${shipment.cost.shipping}`);
                        console.log(`   Assurance: ${currency} ${shipment.cost.insurance}`);
                        if (shipment.estimatedDelivery) {
                            console.log(`   Livraison estimée: ${new Date(shipment.estimatedDelivery).toLocaleString()}`);
                        }
                        const trackingUrl = `${serverUrl}/pages/public_tracking_interface.html?track=${shipment.trackingId}`;
                        console.log(`\n🔗 URL de suivi: ${trackingUrl}`);
                        resolve(shipment);
                    } else {
                        const error = JSON.parse(data);
                        reject(new Error(`Erreur HTTP ${res.statusCode}: ${error.error || data}`));
                    }
                } catch (error) {
                    reject(new Error(`Erreur lors du parsing de la réponse: ${error.message}`));
                }
            });
        });

        req.on('error', (error) => {
            console.error('❌ Erreur lors de la création du shipment:', error.message);
            if (error.code === 'ECONNREFUSED') {
                console.error(`⚠️  Assurez-vous que le serveur est démarré sur ${serverUrl}`);
                console.error('   Pour localhost: npm start');
                console.error('   Pour Render: Vérifiez que votre application est déployée et active');
            }
            reject(error);
        });

        req.write(postData);
        req.end();
    });
}

// Exécuter le script
if (require.main === module) {
    createShipment()
        .then(() => {
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Erreur:', error.message);
            process.exit(1);
        });
}

module.exports = { createShipment, shipmentData };


