const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');

// Route publique pour l'assistant IA de la page d'accueil
router.post('/ask', aiController.ask);

module.exports = router;
