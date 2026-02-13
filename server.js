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
      res.locals.isAdmin = true;
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

User.createTable();
Boat.createTable();
GpsPosition.createTable();
Zone.createTable();

// === 5. Routes d'authentification (register/login/logout) ===
const authRoutes = require('./routes/authRoutes');
app.use('/auth', authRoutes);

// === 6. Routes admin protégées ===
app.use('/admin', require('./routes/admin'));

// === 7. Routes API ===
app.use('/api/boats', require('./routes/boats'));
app.use('/api/zones', require('./routes/zones'));
app.use('/api/users', require('./routes/users'));
app.use('/api/thingsboard', require('./routes/thingsboard'));

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
});