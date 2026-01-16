require('dotenv').config();
const express = require('express');
const path = require('path');
const session = require('express-session');

const app = express();

// === 1. Middlewares essentiels (dans cet ordre !) ===
app.use(express.urlencoded({ extended: true })); // Pour lire les formulaires POST
app.use(express.json());                         // Pour lire du JSON si besoin

// Configuration de la session (doit venir après body parser)
app.use(session({
  secret: 'proj_iot_secret_key_2025', // Tu peux changer cette clé
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // Met true seulement si tu utilises HTTPS
}));

// Middleware pour rendre la session accessible dans toutes les vues
app.use((req, res, next) => {
  res.locals.isAdmin = req.session.isAdmin || false;
  res.locals.username = req.session.username || null;
  next();
});

// === 2. Configuration du moteur de vues ===
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// === 3. Fichiers statiques (CSS, JS, images) ===
app.use(express.static(path.join(__dirname, 'public')));

// === 4. Routes publiques : Login Admin (accessibles sans être connecté) ===
app.get('/admin/login', (req, res) => {
  res.render('admin/login', {
    title: 'Proj_iot - Connexion Admin',
    error: null
  });
});

app.post('/admin/login', (req, res) => {
  const { username, password } = req.body;

  // Change 'donzosd' par le mot de passe que tu veux
  if (username === 'admin' && password === 'donzosd') {
    req.session.isAdmin = true;
    req.session.username = username; // Stockage du nom via la session (ou DB)
    return res.redirect('/admin/ia-qualite');
  } else {
    return res.render('admin/login', {
      title: 'Proj_iot - Connexion Admin',
      error: 'Identifiants incorrects. Utilise admin / donzosd'
    });
  }
});

// === 4b. Routes publiques : Mot de passe oublié ===
// Affiche le formulaire de récupération
app.get('/admin/forgot-password', (req, res) => {
  res.render('admin/forgot-password', {
    title: 'Proj_iot - Récupération de mot de passe',
    error: null,
    success: null
  });
});

// Traite la demande de réinitialisation (Simulation)
app.post('/admin/forgot-password', (req, res) => {
  const { email } = req.body;

  // Simulation : on fait semblant d'envoyer un mail
  // Dans un vrai projet, on vérifierait si l'email existe en base de données
  // puis on enverrait un token via Nodemailer.

  if (email) {
    // Succès simulé pour l'UX
    res.render('admin/forgot-password', {
      title: 'Proj_iot - Email envoyé',
      error: null,
      success: `Si un compte est associé à ${email}, vous recevrez un lien de réinitialisation dans quelques instants.`
    });
  } else {
    res.render('admin/forgot-password', {
      title: 'Proj_iot - Récupération impossible',
      error: 'Veuillez entrer une adresse email valide.',
      success: null
    });
  }
});

// === 5. Middleware de protection admin ===
function isAdmin(req, res, next) {
  if (req.session && req.session.isAdmin) {
    return next();
  }
  res.redirect('/admin/login');
}

// === 6. Route de déconnexion ===
app.get('/admin/logout', isAdmin, (req, res) => {
  req.session.destroy(() => {
    res.redirect('/admin/login');
  });
});

// === 7. Toutes les routes /admin protégées ===
app.use('/admin', isAdmin, require('./routes/admin'));

// === 8. Routes principales du site ===
app.use('/', require('./routes/index'));
app.use('/rapport', require('./routes/rapport'));

// === 9. Page 404 personnalisée ===
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
  console.log(`🔐 Admin login : http://localhost:${PORT}/admin/login (admin / donzosd)`);
});