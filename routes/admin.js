const express = require('express');
const router = express.Router();

router.get('/ia-qualite', (req, res) => {
  res.render('admin/ia-qualite', { title: 'Proj_iot - IA Qualité Eau (Admin)' });
});

module.exports = router; 
