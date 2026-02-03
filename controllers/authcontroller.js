const User = require('../models/User');
const jwt = require('jsonwebtoken');

// INSCRIPTION
exports.register = async (req, res) => {
  try {
    const { username, email, password, confirmPassword, role } = req.body;

    // Validation
    if (!username || !email || !password || !confirmPassword) {
      return res.render('admin/register', {
        title: 'Projet_iot - Inscription',
        error: 'Tous les champs sont requis',
        success: null
      });
    }

    if (password !== confirmPassword) {
      return res.render('admin/register', {
        title: 'Projet_iot - Inscription',
        error: 'Les mots de passe ne correspondent pas',
        success: null
      });
    }

    if (password.length < 6) {
      return res.render('admin/register', {
        title: 'Projet_iot - Inscription',
        error: 'Le mot de passe doit contenir au moins 6 caractères',
        success: null
      });
    }

    // Créer l'utilisateur
    const user = await User.create(username, email, password, role || 'pecheur');

    return res.render('admin/register', {
      title: 'Projet_iot - Inscription',
      error: null,
      success: `Compte créé avec succès ! Bienvenue ${user.username}`
    });
  } catch (err) {
    console.error('Erreur inscription:', err);
    return res.render('admin/register', {
      title: 'Projet_iot - Inscription',
      success: null,
      error: err.message || 'Erreur lors de l\'inscription'
    });
  }
};

// CONNEXION
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.render('admin/login', {
        title: 'Projet_iot - Connexion',
        error: 'Nom d\'utilisateur et mot de passe requis'
      });
    }

    // Chercher l'utilisateur
    const user = await User.findByUsername(username);
    if (!user) {
      return res.render('admin/login', {
        title: 'Projet_iot - Connexion',
        error: 'Identifiants invalides'
      });
    }

    // Vérifier le mot de passe
    const isPasswordValid = await User.verifyPassword(password, user.password);
    if (!isPasswordValid) {
      return res.render('admin/login', {
        title: 'Projet_iot - Connexion',
        error: 'Identifiants invalides'
      });
    }

    // Créer JWT
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log('LOGIN ok user=', user.username, 'token=', token.slice(0, 20),);

    // Stocker le token en session/cookie
    res.cookie('authToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 jours
    });

    console.log('Cookie authToken défini');

    return res.redirect('/admin/dashboard'); // Redirection vers le dashboard principal
  } catch (err) {
    console.error('Erreur connexion:', err);
    return res.render('admin/login', {
      title: 'Projet_iot - Connexion',
      error: 'Erreur serveur'
    });
  }
};

// DÉCONNEXION
exports.logout = (req, res) => {
  res.clearCookie('authToken');
  res.redirect('/admin/login');
};