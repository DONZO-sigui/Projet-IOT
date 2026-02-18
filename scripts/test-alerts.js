/**
 * Script de Test Simple - Génération d'Alertes
 * 
 * Ce script génère des positions GPS qui déclenchent des alertes
 * en utilisant l'API REST du serveur.
 * 
 * Prérequis:
 * - Le serveur doit être lancé (npm run dev)
 * - Au moins un bateau doit exister dans la base de données
 * - Au moins une zone interdite doit être créée
 * 
 * Usage: node scripts/test-alerts.js
 */

async function testAlerts() {
    console.log('🚀 Test du système d\'alertes\n');

    const baseUrl = 'http://localhost:3000';

    try {
        // 1. Récupérer la liste des bateaux
        console.log('📋 Récupération des bateaux...');
        const boatsResponse = await fetch(`${baseUrl}/api/boats`);
        const boatsData = await boatsResponse.json();

        if (!boatsData.success || boatsData.boats.length === 0) {
            console.log('❌ Aucun bateau trouvé. Créez d\'abord un bateau via l\'interface /admin/gps-tracking');
            return;
        }

        const boat = boatsData.boats[0];
        console.log(`✅ Bateau trouvé: ${boat.name} (ID: ${boat.id})\n`);

        // 2. Récupérer les zones
        console.log('🗺️  Récupération des zones...');
        const zonesResponse = await fetch(`${baseUrl}/api/zones`);
        const zonesData = await zonesResponse.json();

        if (!zonesData.success || zonesData.zones.length === 0) {
            console.log('❌ Aucune zone trouvée. Créez d\'abord une zone via l\'interface /admin/zones');
            return;
        }

        const prohibitedZone = zonesData.zones.find(z => z.type === 'prohibited');
        const protectedZone = zonesData.zones.find(z => z.type === 'protected');

        console.log(`✅ ${zonesData.zones.length} zone(s) trouvée(s)`);
        if (prohibitedZone) console.log(`   • Zone interdite: ${prohibitedZone.name}`);
        if (protectedZone) console.log(`   • Zone protégée: ${protectedZone.name}`);
        console.log('');

        // 3. Générer des positions de test
        const testPositions = [
            {
                name: 'Position normale (zone autorisée)',
                latitude: 9.48,
                longitude: -13.67,
                speed: 10,
                expectedAlert: false
            },
            {
                name: 'Position dans zone interdite',
                latitude: 9.52,
                longitude: -13.68,
                speed: 15,
                expectedAlert: true
            },
            {
                name: 'Position en dérive (hors zones)',
                latitude: 9.60,
                longitude: -13.60,
                speed: 5,
                expectedAlert: true
            }
        ];

        console.log('📍 Génération de positions GPS de test...\n');

        for (let i = 0; i < testPositions.length; i++) {
            const pos = testPositions[i];
            console.log(`Test ${i + 1}/3: ${pos.name}`);
            console.log(`   Coordonnées: [${pos.latitude}, ${pos.longitude}]`);

            try {
                const response = await fetch(`${baseUrl}/api/boats/position`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        boatId: boat.id,
                        latitude: pos.latitude,
                        longitude: pos.longitude,
                        speed: pos.speed,
                        heading: 90
                    })
                });

                const result = await response.json();

                if (result.success) {
                    console.log(`   ✅ Position enregistrée`);

                    if (result.alerts && result.alerts.length > 0) {
                        console.log(`   🚨 ${result.alerts.length} alerte(s) générée(s):`);
                        result.alerts.forEach((alert, idx) => {
                            console.log(`      ${idx + 1}. ${alert.severity.toUpperCase()} - ${alert.type}`);
                            console.log(`         ${alert.message.substring(0, 70)}...`);
                        });
                    } else {
                        console.log(`   ℹ️  Aucune alerte (position normale)`);
                    }
                } else {
                    console.log(`   ❌ Erreur: ${result.error}`);
                }
            } catch (error) {
                console.log(`   ❌ Erreur réseau: ${error.message}`);
            }

            console.log('');

            // Attendre 1 seconde entre chaque position
            if (i < testPositions.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        // 4. Afficher les statistiques
        console.log('='.repeat(60));
        console.log('📊 Statistiques des alertes');
        console.log('='.repeat(60));

        try {
            const statsResponse = await fetch(`${baseUrl}/api/alerts/stats`);
            const statsData = await statsResponse.json();

            if (statsData.success) {
                const stats = statsData.stats;
                console.log(`Total: ${stats.total}`);
                console.log(`Actives: ${stats.active}`);
                console.log(`Résolues: ${stats.resolved}`);
                console.log(`Critiques: ${stats.critical}`);
                console.log(`Avertissements: ${stats.warning}`);
            }
        } catch (error) {
            console.log('Impossible de récupérer les statistiques');
        }

        console.log('\n' + '='.repeat(60));
        console.log('✨ TEST TERMINÉ');
        console.log('='.repeat(60));
        console.log('\n🌐 Consultez les alertes sur:');
        console.log(`   • Dashboard: ${baseUrl}/admin/dashboard`);
        console.log(`   • Alertes: ${baseUrl}/admin/alertes`);
        console.log(`   • GPS: ${baseUrl}/admin/gps-tracking`);
        console.log('');

    } catch (error) {
        console.error('\n❌ Erreur:', error.message);
    }
}

// Exécuter le test
console.log('⏳ Démarrage du test...\n');
testAlerts()
    .then(() => {
        console.log('✅ Script terminé');
        process.exit(0);
    })
    .catch(error => {
        console.error('❌ Erreur fatale:', error);
        process.exit(1);
    });
