const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const authController = require('../controllers/authController');
const boatController = require('../controllers/boatController');
const zoneController = require('../controllers/zoneController');
const userController = require('../controllers/userController');
const Boat = require('../models/Boat');
const User = require('../models/User');

// Routes publiques
router.get('/login', (req, res) => {
  res.render('admin/login', { title: 'Proj_iot - Admin Login' });
});

router.get('/register', (req, res) => {
  res.render('admin/register', { title: 'Proj_iot - Admin Register' });
});

// Routes protégées (nécessite authentification)

// Dashboard principal
router.get('/dashboard', authMiddleware.authenticate, async (req, res) => {
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

// Qualité de l'eau
router.get('/ia-qualite', authMiddleware.authenticate, (req, res) => {
  res.locals.currentPath = '/admin/ia-qualite';
  res.render('admin/ia-qualite', {
    title: 'Proj_iot - IA Qualité Eau (Admin)',
    user: req.user
  });
});

// Suivi GPS
router.get('/gps-tracking', authMiddleware.authenticate, boatController.trackingPage);

// Gestion des zones
router.get('/zones', authMiddleware.authenticate, zoneController.zonesPage);

// Gestion des utilisateurs (admin uniquement)
router.get('/utilisateurs',
  authMiddleware.authenticate,
  authMiddleware.authorize(['admin']),
  userController.usersPage
);

// Paramètres système (admin uniquement)
router.get('/parametres',
  authMiddleware.authenticate,
  authMiddleware.authorize(['admin']),
  (req, res) => {
    res.locals.currentPath = '/admin/parametres';
    res.render('admin/parametres', {
      title: 'Proj_iot - Paramètres Système',
      user: req.user
    });
  }
);

// Route de déconnexion
router.get('/logout', authController.logout);

module.exports = router;