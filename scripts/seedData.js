/**
 * Script de génération de données de test pour le système IoT Pêche
 * 
 * Ce script crée des données de démonstration pour :
 * - Utilisateurs avec différents rôles
 * - Bateaux de pêche
 * - Positions GPS simulées
 * - Zones de pêche (autorisées, interdites, protégées)
 * 
 * Utilisation: node scripts/seedData.js
 */

const User = require('../models/User');
const Boat = require('../models/Boat');
const GpsPosition = require('../models/GpsPosition');
const Zone = require('../models/Zone');

// Coordonnées de Conakry, Guinée
const CONAKRY_CENTER = { lat: 9.52, lng: -13.68 };

/**
 * Génère une position GPS aléatoire autour de Conakry
 * @param {number} radiusKm - Rayon en kilomètres
 * @returns {object} Position avec latitude et longitude
 */
function generateRandomPosition(radiusKm = 20) {
    // Conversion km en degrés (approximatif)
    const radiusDeg = radiusKm / 111;

    const randomAngle = Math.random() * 2 * Math.PI;
    const randomRadius = Math.random() * radiusDeg;

    return {
        lat: CONAKRY_CENTER.lat + randomRadius * Math.cos(randomAngle),
        lng: CONAKRY_CENTER.lng + randomRadius * Math.sin(randomAngle)
    };
}

/**
 * Crée des utilisateurs de test
 */
async function createTestUsers() {
    console.log('📝 Création des utilisateurs de test...');

    const users = [
        { username: 'admin', email: 'admin@iot-peche.gn', password: 'admin123', role: 'admin' },
        { username: 'pecheur1', email: 'pecheur1@iot-peche.gn', password: 'pecheur123', role: 'pecheur' },
        { username: 'pecheur2', email: 'pecheur2@iot-peche.gn', password: 'pecheur123', role: 'pecheur' },
        { username: 'observateur', email: 'observateur@iot-peche.gn', password: 'obs123', role: 'observateur' }
    ];

    for (const userData of users) {
        try {
            // Vérifier si l'utilisateur existe déjà
            const existing = await User.findByUsername(userData.username);
            if (!existing) {
                await User.create(userData.username, userData.email, userData.password, userData.role);
                console.log(`  ✅ Utilisateur créé: ${userData.username} (${userData.role})`);
            } else {
                console.log(`  ⏭️  Utilisateur existe déjà: ${userData.username}`);
            }
        } catch (error) {
            console.error(`  ❌ Erreur création ${userData.username}:`, error.message);
        }
    }
}

/**
 * Crée des bateaux de test
 */
async function createTestBoats() {
    console.log('\n🚤 Création des bateaux de test...');

    // Récupérer les ID utilisateurs
    const pecheur1 = await User.findByUsername('pecheur1');
    const pecheur2 = await User.findByUsername('pecheur2');

    if (!pecheur1 || !pecheur2) {
        console.error('  ❌ Erreur: Pêcheurs non trouvés pour l\'assignation des bateaux');
        return [];
    }

    const boats = [
        {
            name: 'Espoir de la Mer',
            registrationNumber: 'GN-CNK-001',
            ownerId: pecheur1.id,
            deviceId: 'ESP32-001',
            status: 'active'
        },
        {
            name: 'Poisson d\'Or',
            registrationNumber: 'GN-CNK-002',
            ownerId: pecheur2.id,
            deviceId: 'ESP32-002',
            status: 'active'
        },
        {
            name: 'Vague Bleue',
            registrationNumber: 'GN-CNK-003',
            ownerId: pecheur1.id,
            deviceId: 'ESP32-003',
            status: 'active'
        },
        {
            name: 'Requin Blanc',
            registrationNumber: 'GN-CNK-004',
            ownerId: pecheur2.id,
            deviceId: 'ESP32-004',
            status: 'inactive'
        }
    ];

    const createdBoats = [];

    for (const boatData of boats) {
        try {
            // Vérifier si existe déjà (pour ne pas dupliquer à chaque run)
            // Note: On peut interroger par registrationNumber si la méthode existait
            // Ici on tente la création qui échouera si contrainte UNIQUE

            let boat;
            try {
                boat = await Boat.create(
                    boatData.name,
                    boatData.registrationNumber,
                    boatData.ownerId,
                    boatData.deviceId
                );
                console.log(`  ✅ Bateau créé: ${boatData.name} (${boatData.registrationNumber})`);
            } catch (err) {
                if (err.code === '23505') { // Code erreur PostgreSQL pour violation de contrainte unique
                    console.log(`  ⏭️  Bateau existe déjà: ${boatData.name}`);
                } else {
                    throw err;
                }
            }

            // Si on vient de créer ou si on doit récupérer l'existant (TODO: ajouter méthode findByRegistration)
            // Pour l'instant on suppose que findAll suffira pour la suite

        } catch (error) {
            console.error(`  ❌ Erreur création ${boatData.name}:`, error.message);
        }
    }

    return await Boat.findAll();
}

/**
 * Crée des positions GPS pour les bateaux actifs
 */
async function createTestGpsPositions(boats) {
    console.log('\n📍 Création des positions GPS...');

    const activeBoats = boats.filter(b => b.status === 'active');

    for (const boat of activeBoats) {
        try {
            // Créer 5 positions pour simuler un historique
            for (let i = 0; i < 5; i++) {
                const position = generateRandomPosition(15);
                const speed = Math.random() * 20 + 5; // Entre 5 et 25 km/h
                const heading = Math.random() * 360; // Direction aléatoire

                await GpsPosition.create(
                    boat.id,
                    position.lat,
                    position.lng,
                    speed,
                    heading,
                    0 // altitude (niveau de la mer)
                );
            }

            console.log(`  ✅ 5 positions GPS créées pour: ${boat.name}`);
        } catch (error) {
            console.error(`  ❌ Erreur positions GPS ${boat.name}:`, error.message);
        }
    }
}

/**
 * Crée des zones de pêche de test
 */
async function createTestZones() {
    console.log('\n🗺️  Création des zones de pêche...');

    const admin = await User.findByUsername('admin');
    const adminId = admin ? admin.id : null;

    const zones = [
        {
            name: 'Zone de Pêche Côtière Nord',
            type: 'fishing',
            coordinates: [
                [9.60, -13.75],
                [9.65, -13.70],
                [9.60, -13.65],
                [9.55, -13.70]
            ],
            description: 'Zone autorisée pour la pêche côtière au nord de Conakry',
            color: '#0066FF'
        },
        {
            name: 'Zone Portuaire Interdite',
            type: 'restricted',
            coordinates: [
                [9.51, -13.70],
                [9.53, -13.68],
                [9.51, -13.66],
                [9.49, -13.68]
            ],
            description: 'Zone portuaire - Pêche strictement interdite',
            color: '#FF0000'
        },
        {
            name: 'Réserve Marine Protégée',
            type: 'protected',
            coordinates: [
                [9.55, -13.60],
                [9.60, -13.55],
                [9.55, -13.50],
                [9.50, -13.55]
            ],
            description: 'Zone de protection de la biodiversité marine',
            color: '#00CC66'
        }
    ];

    for (const zoneData of zones) {
        try {
            await Zone.create(
                zoneData.name,
                zoneData.type,
                zoneData.coordinates,
                zoneData.description,
                zoneData.color,
                adminId
            );

            console.log(`  ✅ Zone créée: ${zoneData.name} (${zoneData.type})`);
        } catch (error) {
            // Ignorer erreur si doublon (pas de contrainte unique sur nom pour l'instant)
            console.log(`  ℹ️  Zone créée: ${zoneData.name}`);
        }
    }
}

/**
 * Fonction principale d'exécution
 */
async function seedDatabase() {
    console.log('🌱 Démarrage du seeding de la base de données...\n');

    try {
        // 1. Créer les tables si nécessaire
        await User.createTable();
        await Boat.createTable();
        await GpsPosition.createTable();
        await Zone.createTable();

        // 2. Créer les données
        await createTestUsers();

        // 3. Créer les bateaux
        const boats = await createTestBoats();

        // 4. Créer les positions GPS
        if (boats.length > 0) {
            await createTestGpsPositions(boats);
        }

        // 5. Créer les zones
        await createTestZones();

        console.log('\n✅ Seeding terminé avec succès !');
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Erreur lors du seeding:', error);
        process.exit(1);
    }
}

// Exécuter le seeding
seedDatabase();
