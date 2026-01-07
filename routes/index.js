const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.render('index', { title: 'Proj_iot - Accueil' });
});

module.exports = router;