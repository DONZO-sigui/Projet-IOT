/**
 * Script de Test des Alertes - Console Navigateur
 * 
 * Copiez-collez ce code dans la console du navigateur (F12)
 * pendant que vous êtes connecté sur une page admin.
 * 
 * Ce script va générer automatiquement des positions GPS
 * qui déclenchent des alertes.
 */

async function testAlertsFromBrowser() {
    console.log('🚀 Test du système d\'alertes\n');
    console.log('='.repeat(60));

    try {
        // 1. Récupérer les bateaux
        console.log('\n📋 Récupération des bateaux...');
        const boatsResponse = await fetch('/api/boats');
        const boatsData = await boatsResponse.json();

        if (!boatsData.success || boatsData.boats.length === 0) {
            console.error('❌ Aucun bateau trouvé.');
            console.log('💡 Créez un bateau sur /admin/gps-tracking');
            return;
        }

        const boat = boatsData.boats[0];
        console.log(`✅ Bateau: ${boat.name} (ID: ${boat.id})`);

        // 2. Positions de test
        const testPositions = [
            {
                name: '🚨 Position dans zone INTERDITE',
                lat: 9.52,
                lon: -13.68,
                speed: 15,
                icon: '⛔'
            },
            {
                name: '⚠️  Position dans zone PROTÉGÉE',
                lat: 9.50,
                lon: -13.70,
                speed: 10,
                icon: '🛡️'
            },
            {
                name: '🌊 Position en DÉRIVE (hors zones)',
                lat: 9.60,
                lon: -13.60,
                speed: 5,
                icon: '⚓'
            }
        ];

        console.log('\n📍 Génération de positions GPS...\n');

        let alertCount = 0;

        for (let i = 0; i < testPositions.length; i++) {
            const pos = testPositions[i];

            console.log(`${pos.icon} Test ${i + 1}/3: ${pos.name}`);
            console.log(`   Coordonnées: [${pos.lat}, ${pos.lon}]`);

            try {
                const response = await fetch('/api/boats/positions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        boatId: boat.id,
                        latitude: pos.lat,
                        longitude: pos.lon,
                        speed: pos.speed,
                        heading: 90
                    })
                });

                const result = await response.json();

                if (result.success) {
                    console.log(`   ✅ Position enregistrée`);

                    if (result.alerts && result.alerts.length > 0) {
                        alertCount += result.alerts.length;
                        console.log(`   🚨 ${result.alerts.length} alerte(s) générée(s):`);
                        result.alerts.forEach((alert, idx) => {
                            const severityIcon = {
                                'critical': '🔴',
                                'warning': '🟠',
                                'info': '🔵'
                            }[alert.severity] || '⚪';

                            console.log(`      ${severityIcon} ${alert.severity.toUpperCase()}`);
                            console.log(`         Type: ${alert.type}`);
                            console.log(`         ${alert.message.substring(0, 60)}...`);
                        });
                    } else {
                        console.log(`   ℹ️  Aucune alerte (position normale)`);
                    }
                } else {
                    console.error(`   ❌ Erreur: ${result.error}`);
                }
            } catch (error) {
                console.error(`   ❌ Erreur: ${error.message}`);
            }

            console.log('');

            // Attendre 500ms entre chaque position
            if (i < testPositions.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }

        // 3. Statistiques
        console.log('='.repeat(60));
        console.log('📊 RÉSULTATS');
        console.log('='.repeat(60));

        try {
            const statsResponse = await fetch('/api/alerts/stats');
            const statsData = await statsResponse.json();

            if (statsData.success) {
                const stats = statsData.stats;
                console.log(`\n✨ Alertes générées: ${alertCount}`);
                console.log(`\n📈 Statistiques globales:`);
                console.log(`   • Total: ${stats.total}`);
                console.log(`   • Actives: ${stats.active}`);
                console.log(`   • Résolues: ${stats.resolved}`);
                console.log(`   • Critiques: ${stats.critical}`);
                console.log(`   • Avertissements: ${stats.warning}`);
            }
        } catch (error) {
            console.log('Impossible de récupérer les statistiques');
        }

        console.log('\n' + '='.repeat(60));
        console.log('✅ TEST TERMINÉ');
        console.log('='.repeat(60));
        console.log('\n💡 Consultez les alertes sur:');
        console.log('   • http://localhost:3000/admin/alertes');
        console.log('   • http://localhost:3000/admin/dashboard');
        console.log('\n🔄 Rafraîchissez la page pour voir les nouvelles alertes !');
        console.log('');

    } catch (error) {
        console.error('\n❌ Erreur:', error);
    }
}

// Lancer le test
console.log('%c🚨 SCRIPT DE TEST DES ALERTES', 'font-size: 20px; font-weight: bold; color: #ff0000;');
console.log('%cCopiez-collez cette fonction dans la console et exécutez:', 'font-size: 14px; color: #0066cc;');
console.log('%ctestAlertsFromBrowser()', 'font-size: 16px; font-weight: bold; color: #00cc00; background: #000; padding: 5px;');
console.log('\n');

// Auto-exécution si ce fichier est chargé
if (typeof window !== 'undefined') {
    console.log('⏳ Lancement automatique du test dans 2 secondes...');
    setTimeout(() => {
        testAlertsFromBrowser();
    }, 2000);
}
