const express = require('express');
const router = express.Router();
const alertController = require('../controllers/alertController');
const authMiddleware = require('../middleware/authMiddleware');

/**
 * Routes API pour les alertes
 * Toutes les routes nécessitent une authentification
 */

// Récupérer toutes les alertes (avec filtres)
router.get('/', authMiddleware.authenticate, alertController.getAllAlerts);

// Récupérer les alertes actives (non acquittées)
router.get('/active', authMiddleware.authenticate, alertController.getActiveAlerts);

// Récupérer les statistiques des alertes
router.get('/stats', authMiddleware.authenticate, alertController.getStats);

// Récupérer une alerte spécifique
router.get('/:id', authMiddleware.authenticate, alertController.getAlertById);

// Marquer une alerte comme acquittée
router.put('/:id/acknowledge', authMiddleware.authenticate, alertController.acknowledgeAlert);

// Supprimer une alerte (admin uniquement)
router.delete('/:id', authMiddleware.authenticate, authMiddleware.authorize(['admin']), alertController.deleteAlert);

// Générer une alerte de simulation (pour démo)
router.post('/generate', authMiddleware.authenticate, authMiddleware.authorize(['admin', 'technicien']), alertController.generateMockAlert);

module.exports = router;
