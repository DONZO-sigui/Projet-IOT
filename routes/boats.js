const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const boatController = require('../controllers/boatController');

// Toutes les routes nécessitent authentification
router.use(authMiddleware.authenticate);

// Routes API pour les bateaux
router.get('/', boatController.getAllBoats);
router.post('/', boatController.createBoat);
router.get('/:id', boatController.getBoatDetails);
router.put('/:id', boatController.updateBoat);
router.delete('/:id', authMiddleware.authorize(['admin']), boatController.deleteBoat);

// Routes pour les positions GPS
router.get('/:id/positions', boatController.getBoatPositions);
router.post('/positions', boatController.recordPosition);

module.exports = router;
