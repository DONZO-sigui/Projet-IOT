const express = require('express');
const router = express.Router();
const deviceController = require('../controllers/deviceController');
const authMiddleware = require('../middleware/authMiddleware');

// Middleware d'authentification pour toutes les routes
router.use(authMiddleware.authenticate);

// Page de gestion des dispositifs (Admin seulement)
router.get('/', authMiddleware.authorize(['admin', 'technicien']), deviceController.devicesPage);

// API Routes
router.get('/all', deviceController.getAllDevices);
router.get('/:id', deviceController.getDeviceDetails);
router.post('/', authMiddleware.authorize(['admin']), deviceController.createDevice);
router.put('/:id/config', authMiddleware.authorize(['admin', 'technicien']), deviceController.updateConfig);
router.post('/:id/action', authMiddleware.authorize(['admin', 'technicien']), deviceController.deviceAction);

module.exports = router;
