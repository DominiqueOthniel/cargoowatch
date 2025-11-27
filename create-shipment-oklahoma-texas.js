/**
 * Script pour créer un shipment de l'Oklahoma vers Fort Worth, Texas
 * Destinataire: Djana Campbell
 * Usage: node create-shipment-oklahoma-texas.js
 */

const http = require('http');

const shipmentData = {
    sender: {
        name: "Oklahoma Shipping Center",
        email: "oklahoma@cargowatch.com",
        phone: "+14055551234",
        address: {
            street: "123 Main Street",
            city: "Oklahoma City",
            state: "Oklahoma",
            zipCode: "73102",
            country: "US"
        }
    },
    recipient: {
        name: "Djana Campbell",
        email: "djana.campbell@example.com",
        phone: "+18175551234",
        address: {
            street: "6004 Monta Vista Lane Apt 237",
            city: "Fort Worth",
            state: "Texas",
            zipCode: "76132",
            country: "US"
        }
    },
    package: {
        type: "medium-box",
        weight: 5.5,
        dimensions: {
            length: 30,
            width: 25,
            height: 20
        },
        description: "Package from Oklahoma to Texas",
        value: 250.00,
        currency: "USD"
    },
    service: {
        type: "standard",
        priority: "normal",
        insurance: true
    },
    cost: {
        base: 25.00,
        shipping: 35.00,
        insurance: 5.00,
        currency: "USD"
    }
};

function createShipment() {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify(shipmentData);
        
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: '/api/shipments',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        console.log('📦 Création d\'un nouveau shipment...');
        console.log('De: Oklahoma → Vers: Fort Worth, Texas');
        console.log('Destinataire: Djana Campbell');
        console.log('Données:', JSON.stringify(shipmentData, null, 2));

        const req = http.request(options, (res) => {
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
                        const currency = shipment.cost?.currency || shipment.package?.currency || 'USD';
                        console.log(`   Coût total: ${currency} ${shipment.cost.total}`);
                        if (shipment.estimatedDelivery) {
                            console.log(`   Livraison estimée: ${new Date(shipment.estimatedDelivery).toLocaleString()}`);
                        }
                        console.log(`\n🔗 URL de suivi: http://localhost:3000/pages/public_tracking_interface.html?track=${shipment.trackingId}`);
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
                console.error('⚠️  Assurez-vous que le serveur est démarré sur http://localhost:3000');
                console.error('   Démarrez le serveur avec: npm start');
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

