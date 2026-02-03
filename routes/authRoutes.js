const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.get('/login', (req, res) => {
  res.render('admin/login', { title: 'Proj_iot - Admin Login' });
});

router.post('/login', authController.login);

router.get('/register', (req, res) => {
  res.render('admin/register', { title: 'Proj_iot - Inscription', error: null, success: null });
});

router.post('/register', authController.register);

router.get('/logout', authController.logout);

module.exports = router;