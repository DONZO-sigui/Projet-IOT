const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const authController = require('../controllers/authController');
const boatController = require('../controllers/boatController');
const zoneController = require('../controllers/zoneController');
const userController = require('../controllers/userController');
const Boat = require('../models/Boat');
const User = require('../models/User');
const Alert = require('../models/Alert');
const settingsController = require('../controllers/settingsController');

// Middleware pour injecter le nombre d'alertes actives dans toutes les vues admin
async function injectAlertsCount(req, res, next) {
  try {
    if (req.user) {
      const stats = await Alert.getStats();
      res.locals.alertsCount = parseInt(stats.active) || 0;
    }
  } catch (err) {
    // Ne pas bloquer le rendu si la requête échoue
    res.locals.alertsCount = 0;
  }
  next();
}

// Routes publiques
router.get('/login', (req, res) => {
  res.render('admin/login', { title: 'Proj_iot - Admin Login' });
});

router.get('/register', (req, res) => {
  res.render('admin/register', { title: 'Proj_iot - Admin Register' });
});

// Routes protégées (nécessite authentification)

// Dashboard principal
router.get('/dashboard', authMiddleware.authenticate, injectAlertsCount, async (req, res) => {
  try {
    res.locals.currentPath = '/admin/dashboard';
    const activeBoatsCount = await Boat.countActive();
    res.locals.activeBoatsCount = activeBoatsCount;

    res.render('admin/dashboard', {
      title: 'Proj_iot - Dashboard Admin',
      user: req.user
    });
  } catch (error) {
    console.error('Erreur dashboard:', error);
    res.status(500).send('Erreur serveur');
  }
});

// Qualité de l'eau (admin uniquement)
router.get('/ia-qualite',
  authMiddleware.authenticate,
  authMiddleware.authorize(['admin', 'pecheur']),
  injectAlertsCount,
  (req, res) => {
    res.locals.currentPath = '/admin/ia-qualite';
    res.render('admin/ia-qualite', {
      title: 'Proj_iot - IA Qualité Eau (Admin)',
      user: req.user
    });
  });

// Suivi GPS (accessible à tous, mais filtré par contrôleur)
router.get('/gps-tracking', authMiddleware.authenticate, injectAlertsCount, boatController.trackingPage);

// Gestion des zones (accessible à tous, lecture seule pour pecheur?)
// Pour l'instant on laisse accessible, le contrôleur filtre peut-être
router.get('/zones', authMiddleware.authenticate, injectAlertsCount, zoneController.zonesPage);

// Gestion des alertes (admin uniquement pour la vue globale)
router.get('/alertes',
  authMiddleware.authenticate,
  authMiddleware.authorize(['admin', 'pecheur']),
  injectAlertsCount,
  (req, res) => {
    res.locals.currentPath = '/admin/alertes';
    res.render('admin/alertes', {
      title: 'Proj_iot - Alertes',
      user: req.user
    });
  });

// Gestion des utilisateurs (admin uniquement)
router.get('/utilisateurs',
  authMiddleware.authenticate,
  authMiddleware.authorize(['admin', 'pecheur']),
  injectAlertsCount,
  userController.usersPage
);

// Paramètres système (admin uniquement)
router.get('/parametres',
  authMiddleware.authenticate,
  authMiddleware.authorize(['admin', 'pecheur']),
  injectAlertsCount,
  (req, res) => {
    res.locals.currentPath = '/admin/parametres';
    res.render('admin/parametres', {
      title: 'Proj_iot - Paramètres Système',
      user: req.user
    });
  }
);

// Historique des données (admin + pecheur)
router.get('/historique',
  authMiddleware.authenticate,
  authMiddleware.authorize(['admin', 'pecheur']),
  injectAlertsCount,
  (req, res) => {
    res.locals.currentPath = '/admin/historique';
    res.render('admin/historique', {
      title: 'Proj_iot - Historique des Données',
      user: req.user
    });
  }
);

// Route de déconnexion
router.get('/logout', authController.logout);

// API pour sauvegarder les paramètres
router.post('/settings', authMiddleware.authenticate, authMiddleware.authorize(['admin']), settingsController.updateSettings);

module.exports = router;