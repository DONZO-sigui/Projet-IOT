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

// Middleware pour injecter les statistiques de la sidebar (alertes, bateaux)
async function injectSidebarStats(req, res, next) {
  try {
    if (req.user) {
      if (req.user.role === 'pecheur') {
        // Stats personnelles pour le pêcheur
        const alertStats = await Alert.getStatsByOwner(req.user.id);
        res.locals.alertsCount = parseInt(alertStats.active) || 0;

        const activeBoatsCount = await Boat.countActiveByOwner(req.user.id);
        res.locals.activeBoatsCount = activeBoatsCount;
      } else {
        // Stats globales pour Admin/Technicien/etc.
        const alertStats = await Alert.getStats();
        res.locals.alertsCount = parseInt(alertStats.active) || 0;

        const activeBoatsCount = await Boat.countActive();
        res.locals.activeBoatsCount = activeBoatsCount;
      }
    }
  } catch (err) {
    console.error('Erreur injection stats sidebar:', err);
    res.locals.alertsCount = 0;
    res.locals.activeBoatsCount = 0;
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
router.get('/dashboard', authMiddleware.authenticate, injectSidebarStats, async (req, res) => {
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

// Qualité de l'eau (Non-pêcheurs)
router.get('/ia-qualite',
  authMiddleware.authenticate,
  authMiddleware.authorize(['admin', 'technicien', 'observateur']),
  injectSidebarStats,
  (req, res) => {
    res.locals.currentPath = '/admin/ia-qualite';
    res.render('admin/ia-qualite', {
      title: 'Proj_iot - IA Qualité Eau (Admin)',
      user: req.user
    });
  });

// Suivi GPS (accessible à tous, mais filtré par contrôleur)
router.get('/gps-tracking', authMiddleware.authenticate, injectSidebarStats, boatController.trackingPage);

// Mon Profil
router.get('/profil', authMiddleware.authenticate, injectSidebarStats, userController.profilePage);
router.post('/profil', authMiddleware.authenticate, userController.updateUserProfile);

// Gestion des zones (accessible à tous, lecture seule pour pecheur?)
// Pour l'instant on laisse accessible, le contrôleur filtre peut-être
router.get('/zones', authMiddleware.authenticate, injectSidebarStats, zoneController.zonesPage);

// Gestion des alertes (admin uniquement pour la vue globale)
router.get('/alertes',
  authMiddleware.authenticate,
  authMiddleware.authorize(['admin', 'pecheur']),
  injectSidebarStats,
  (req, res) => {
    res.locals.currentPath = '/admin/alertes';
    res.render('admin/alertes', {
      title: 'Proj_iot - Alertes',
      user: req.user
    });
  });

// Gestion des utilisateurs (Admin Only)
router.get('/utilisateurs',
  authMiddleware.authenticate,
  authMiddleware.authorize(['admin']),
  injectSidebarStats,
  userController.usersPage
);

// Paramètres système (Admin Only)
router.get('/parametres',
  authMiddleware.authenticate,
  authMiddleware.authorize(['admin']),
  injectSidebarStats,
  (req, res) => {
    res.locals.currentPath = '/admin/parametres';
    res.render('admin/parametres', {
      title: 'Proj_iot - Paramètres Système',
      user: req.user
    });
  }
);

// Historique des données (Non-pêcheurs)
router.get('/historique',
  authMiddleware.authenticate,
  authMiddleware.authorize(['admin', 'technicien']),
  injectSidebarStats,
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