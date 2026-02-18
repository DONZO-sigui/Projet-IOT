const express = require('express');
const router = express.Router();
const Alert = require('../models/Alert');
const Zone = require('../models/Zone');
const Boat = require('../models/Boat');

// Route publique de test pour vérifier la génération d'alertes
router.get('/test-generate', async (req, res) => {
    try {
        console.log('🧪 Test de génération d\'alerte appelé');

        // 1. Récupérer un bateau et une zone
        const boats = await Boat.findAll();
        const zones = await Zone.findAll();

        if (boats.length === 0 || zones.length === 0) {
            return res.json({ success: false, message: 'Pas de bateaux ou zones pour le test' });
        }

        const boat = boats[0];
        const zone = zones[0];

        // 2. Créer une alerte
        console.log(`Création alerte pour bateau ${boat.id} et zone ${zone.id}`);
        const alert = await Alert.create(
            boat.id,
            zone.id,
            'test_alert',
            'critical',
            'Ceci est une alerte de TEST (Génération forcée)',
            9.52,
            -13.68
        );

        console.log('✅ Alerte créée:', alert);
        res.json({ success: true, alert });
    } catch (error) {
        console.error('❌ Erreur test:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
