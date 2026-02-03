const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const userController = require('../controllers/userController');
const Boat = require('../models/Boat');
const User = require('../models/User');

// Toutes les routes nécessitent authentification admin
router.use(authMiddleware.authenticate);
router.use(authMiddleware.authorize(['admin']));

// Routes API pour les utilisateurs
router.get('/', userController.getAllUsers);
router.get('/stats', userController.getUserStats);
router.get('/:id', userController.getUserDetails);
router.put('/:id/role', userController.updateUserRole);
router.put('/:id/status', userController.toggleUserStatus);
router.delete('/:id', userController.deleteUser);

// Route pour les statistiques du dashboard
router.get('/dashboard/stats', async (req, res) => {
    try {
        const activeBoats = await Boat.countActive();
        // TODO: Ajouter d'autres statistiques

        res.json({
            success: true,
            activeBoats,
            totalUsers: 0,
            activeAlerts: 0
        });
    } catch (error) {
        console.error('Erreur statistiques dashboard:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
