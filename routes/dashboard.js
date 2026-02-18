const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const User = require('../models/User');
const Boat = require('../models/Boat');
const Device = require('../models/Device');
const Alert = require('../models/Alert');

/**
 * @route GET /api/dashboard/stats
 * @desc Récupère les statistiques globales pour le tableau de bord
 * @access Private
 */
router.get('/stats', authMiddleware.authenticate, async (req, res) => {
    try {
        let userStats = { total: 0 };
        let boatStats, deviceStats, alertStats;

        if (req.user && req.user.role === 'pecheur') {
            // Stats personnelles pour le pêcheur
            boatStats = await Boat.getStatsByOwner(req.user.id);
            alertStats = await Alert.getStatsByOwner(req.user.id);
            deviceStats = { total: 0, online: 0 }; // Masquer les devices globaux
            // userStats reste à 0
        } else {
            // Stats globales pour Admin/Technicien/etc.
            userStats = await User.getStats();
            boatStats = await Boat.getStats();
            deviceStats = await Device.getStats();
            alertStats = await Alert.getStats();
        }

        res.json({
            success: true,
            userStats,
            boatStats,
            deviceStats,
            alertStats,
            // Raccourcis pour le frontend
            activeBoats: boatStats.active,
            totalBoats: boatStats.total,
            activeAlerts: alertStats.active,
            onlineDevices: deviceStats.online,
            totalDevices: deviceStats.total,
            totalUsers: userStats.total
        });
    } catch (error) {
        console.error('Erreur dashboard stats:', error);
        res.status(500).json({ success: false, error: 'Erreur serveur' });
    }
});

module.exports = router;
