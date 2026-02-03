const jwt = require('jsonwebtoken');

exports.authenticate = (req, res, next) => {
  console.log('Cookies:', req.cookies); // debug
  const tokenFromCookie = req.cookies && req.cookies.authToken;
  const authHeader = req.headers.authorization || '';
  const tokenFromHeader = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
  const token = tokenFromCookie || tokenFromHeader;

  if (!token) {
    console.log('No token, redirecting to login');
    return res.redirect('/auth/login'); // utiliser /auth/login si vos routes d'auth sont montées sur /auth
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    console.log('Token decoded:', { id: decoded.id, username: decoded.username, role: decoded.role });
    next();
  } catch (err) {
    console.log('Token verify failed:', err.message);
    res.clearCookie('authToken');
    return res.redirect('/auth/login');
  }
};

exports.authorize = (roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).render('admin/403', { error: 'Accès refusé' });
    }
    next();
  };
};