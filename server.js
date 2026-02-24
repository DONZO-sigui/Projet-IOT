/**
 * Serveur Principal - IoT Pêche
 * 
 * Point d'entrée de l'application Node.js/Express.
 * Configure le serveur, la base de données, les middlewares et les routes.
 * 
 * @author VotreNom
 * @version 1.0.0
 */

require('dotenv').config();
const express = require('express');
const path = require('path');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const User = require('./models/User');

const app = express();

app.set('view cache', false);

// === 1. Middlewares essentiels ===
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

// Configuration de la session
app.use(session({
  secret: 'proj_iot_secret_key_2025',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
}));

// Middleware global pour décoder le JWT et passer les infos utilisateur aux vues
const jwt = require('jsonwebtoken');
app.use((req, res, next) => {
  const token = req.cookies && req.cookies.authToken;

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      res.locals.isAdmin = decoded.role === 'admin';
      res.locals.username = decoded.username;
      res.locals.userRole = decoded.role;
      res.locals.userId = decoded.id;
    } catch (err) {
      // Token invalide ou expiré
      res.locals.isAdmin = false;
      res.locals.username = null;
      res.locals.userRole = null;
      res.locals.userId = null;
    }
  } else {
    // Pas de token
    res.locals.isAdmin = false;
    res.locals.username = null;
    res.locals.userRole = null;
    res.locals.userId = null;
  }

  next();
});

// === 2. Configuration du moteur de vues ===
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// === 3. Fichiers statiques ===
app.use(express.static(path.join(__dirname, 'public')));

// === 4. Créer les tables au démarrage ===
const Boat = require('./models/Boat');
const GpsPosition = require('./models/GpsPosition');
const Zone = require('./models/Zone');
const Alert = require('./models/Alert');

User.createTable();
Boat.createTable();
GpsPosition.createTable();
Zone.createTable();
Alert.createTable();
const ActivityLog = require('./models/ActivityLog');
ActivityLog.createTable();

// === 5. Routes d'authentification (register/login/logout) ===
const authRoutes = require('./routes/authRoutes');
app.use('/auth', authRoutes);

// === 6. Routes admin protégées ===
app.use('/admin', require('./routes/admin'));
app.use('/admin/dispositifs', require('./routes/devices')); // Nouvelle route pour les devices IoT

// === 7. Routes API ===
app.use('/api/boats', require('./routes/boats'));
app.use('/api/zones', require('./routes/zones'));
app.use('/api/users', require('./routes/users'));
app.use('/api/thingsboard', require('./routes/thingsboard'));
app.use('/api/alerts', require('./routes/alerts'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/ai', require('./routes/ai')); // Nouvel assistant IA
app.use('/test', require('./routes/test')); // Route temporaire de debug

// API Historique GPS
const authMiddleware = require('./middleware/authMiddleware');
const pool = require('./config/database');
app.get('/api/history/gps', authMiddleware.authenticate, async (req, res) => {
  try {
    const { boatId, start, end, limit = 200 } = req.query;
    let conditions = [];
    let params = [];
    let idx = 1;

    if (boatId) {
      // Sécurité: Si pêcheur, vérifier que le bateau lui appartient
      if (req.user.role === 'pecheur') {
        const [boat] = (await pool.query('SELECT owner_id FROM boats WHERE id = $1', [boatId])).rows;
        if (!boat || boat.owner_id !== req.user.id) {
          return res.status(403).json({ error: 'Accès non autorisé à ce bateau' });
        }
      }
      conditions.push(`gp.boat_id = $${idx++}`);
      params.push(boatId);
    } else if (req.user.role === 'pecheur') {
      // Si pas de boatId spécifié et c'est un pêcheur, on limite à ses propres bateaux via une jointure
      conditions.push(`b.owner_id = $${idx++}`);
      params.push(req.user.id);
    }
    if (start) { conditions.push(`gp.timestamp >= $${idx++}`); params.push(start); }
    if (end) { conditions.push(`gp.timestamp <= $${idx++}`); params.push(end + 'T23:59:59'); }

    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
    const sql = `
      SELECT gp.*, b.name as boat_name, b.registration_number
      FROM gps_positions gp
      LEFT JOIN boats b ON gp.boat_id = b.id
      ${where}
      ORDER BY gp.timestamp DESC
      LIMIT $${idx}
    `;
    params.push(parseInt(limit));
    const result = await pool.query(sql, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Erreur API history/gps:', err);
    res.status(500).json({ error: err.message });
  }
});

// API Historique Activités
app.get('/api/history/activity', authMiddleware.authenticate, authMiddleware.authorize(['admin', 'technicien', 'pecheur']), async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;

    // Si pêcheur, on ne montre que ses logs
    const userId = req.user.role === 'pecheur' ? req.user.id : null;

    const logs = await ActivityLog.getRecent(limit, userId);
    res.json(logs);
  } catch (err) {
    console.error('Erreur API history/activity:', err);
    res.status(500).json({ error: err.message });
  }
});


// === 8. Routes publiques du site ===
app.use('/', require('./routes/index'));
app.use('/rapport', require('./routes/rapport'));

// === 9. Page 404 ===
app.use((req, res) => {
  res.status(404).send(`
    <div style="text-align:center; margin-top:100px; font-family: Arial, sans-serif;">
      <h1 style="font-size: 80px; color: #0d6efd;">404</h1>
      <h2>Page non trouvée</h2>
      <p>Désolé, cette page n'existe pas.</p>
      <a href="/" style="color: #0d6efd; font-size: 18px;">← Retour à l'accueil Proj_iot</a>
    </div>
  `);
});

// === 10. Démarrage du serveur ===
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Proj_iot est lancé avec succès !`);
  console.log(`🌐 Accède au site : http://localhost:${PORT}`);
  console.log(`📝 Inscription : http://localhost:${PORT}/auth/register`);
  console.log(`🔐 Connexion : http://localhost:${PORT}/auth/login`);

  // Démarrer la simulation IoT en arrière-plan
  const virtualDeviceService = require('./services/virtualDeviceService');
  const simulationService = require('./services/simulationService');

  console.log("🤖 Démarrage des simulations (IoT & Mouvement)...");

  setInterval(async () => {
    try {
      await virtualDeviceService.generateAllTelemetry();
    } catch (err) {
      console.error("Erreur cycle simulation:", err);
    }
  }, 10000); // Toutes les 10 secondes

  // Simulation du mouvement des bateaux
  simulationService.start();
});