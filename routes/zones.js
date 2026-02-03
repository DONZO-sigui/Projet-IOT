const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const zoneController = require('../controllers/zoneController');

// Toutes les routes nécessitent authentification
router.use(authMiddleware.authenticate);

// Routes API pour les zones
router.get('/', zoneController.getAllZones);
router.post('/', authMiddleware.authorize(['admin']), zoneController.createZone);
router.get('/stats', zoneController.getZoneStats);
router.get('/:id', zoneController.getZoneById);
router.put('/:id', authMiddleware.authorize(['admin']), zoneController.updateZone);
router.delete('/:id', authMiddleware.authorize(['admin']), zoneController.deleteZone);

module.exports = router;
