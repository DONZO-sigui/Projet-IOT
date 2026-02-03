const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.render('index', { title: 'Proj_iot - Accueil' });
});

// Route Information IoT (Observateur Public)
router.get('/info-iot', (req, res) => {
  res.render('info-iot', { title: 'L\'IoT et la Pêche' });
});

module.exports = router;