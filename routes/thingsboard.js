const express = require('express');
const router = express.Router();
const thingsboardService = require('../services/thingsboardService');
const Boat = require('../models/Boat');

// Middleware d'authentification requis pour accéder aux données IoT
const { authenticate } = require('../middleware/authMiddleware'); // Assurez-vous que ce chemin est correct ou utilisez le middleware global

/**
 * @route GET /api/thingsboard/telemetry/:deviceId
 * @desc Récupérer la télémétrie en temps réel (simulée)
 */
router.get('/telemetry/:deviceId', async (req, res) => {
    try {
        const { deviceId } = req.params;

        // Vérification de sécurité (optionnelle) : l'utilisateur a-t-il le droit de voir ce device ?
        // On pourrait vérifier si le device appartient à un bateau de l'utilisateur

        const telemetry = await thingsboardService.getDeviceTelemetry(deviceId);
        res.json({ success: true, telemetry });
    } catch (error) {
        console.error('Erreur API ThingsBoard:', error);
        res.status(500).json({ success: false, error: 'Erreur récupération données IoT' });
    }
});

/**
 * @route GET /api/thingsboard/dashboard-summary
 * @desc Récupérer un résumé global pour le dashboard
 */
router.get('/dashboard-summary', async (req, res) => {
    try {
        // Simuler des données agrégées
        const summary = {
            total_alerts: (await thingsboardService.getAlarms()).length,
            average_ph: 7.2,
            average_temp: 26.5,
            system_status: 'NORMAL'
        };
        res.json({ success: true, summary });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
