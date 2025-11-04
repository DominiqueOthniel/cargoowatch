/**
 * Script pour ajouter un shipment de test
 * Usage: node add-shipment.js
 */

const http = require('http');

const shipmentData = {
    sender: {
        name: "Yuki Tanaka",
        email: "yuki.tanaka@example.com",
        phone: "+81312345678",
        address: {
            street: "1-1-1 Shibuya",
            city: "Tokyo",
            state: "Tokyo",
            zipCode: "150-0002",
            country: "JP"
        }
    },
    recipient: {
        name: "Hiroshi Yamamoto",
        email: "hiroshi.yamamoto@example.com",
        phone: "+81698765432",
        address: {
            street: "2-2-2 Chuo-ku",
            city: "Osaka",
            state: "Osaka",
            zipCode: "540-0001",
            country: "JP"
        }
    },
    package: {
        type: "small-box",
        weight: 3.2,
        dimensions: {
            length: 25,
            width: 20,
            height: 15
        },
        description: "Livres et documents",
        value: 15000.00,
        currency: "JPY"
    },
    service: {
        type: "standard",
        priority: "normal",
        insurance: true
    },
    cost: {
        base: 2500.00,
        shipping: 1500.00,
        insurance: 500.00,
        currency: "JPY"
    }
};

function addShipment() {
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
                        const currency = shipment.cost?.currency || shipment.package?.currency || 'USD';
                        console.log(`   Coût total: ${currency} ${shipment.cost.total}`);
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
addShipment()
    .then(() => {
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Erreur:', error.message);
        process.exit(1);
    });

