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
        const userStats = await User.getStats();
        const boatStats = await Boat.getStats();
        const deviceStats = await Device.getStats();
        const alertStats = await Alert.getStats();

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
