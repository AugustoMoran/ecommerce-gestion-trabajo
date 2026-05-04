const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../utils/logger');

/**
 * Middleware: verify access token from cookie (HTTP-only) or Authorization header.
 * Cookies are PRIMARY (secure). Header is FALLBACK for mobile only.
 * Attaches req.user on success.
 */
const protect = async (req, res, next) => {
  try {
    let token = req.cookies.accessToken;
    
    // Fallback: SOLO si no hay cookie, intenta header (para móvil)
    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.slice(7);
        logger.debug('Token obtained from Authorization header (mobile fallback)');
      }
    } else {
      logger.debug('Token obtained from HTTP-only cookie');
    }
    
    if (!token) {
      return res.status(401).json({ message: 'No autorizado. Token requerido.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select('-password');
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Usuario no encontrado o inactivo.' });
    }

    req.user = user;
    logger.debug('User authenticated', { email: user.email });
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expirado.', code: 'TOKEN_EXPIRED' });
    }
    logger.error('Auth error in protect', { message: error.message });
    return res.status(401).json({ message: 'Token inválido.' });
  }
};

/**
 * Middleware: protect + admin role required.
 */
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') return next();
  return res.status(403).json({ message: 'Acceso denegado. Solo administradores.' });
};

/**
 * Middleware: optionally attach user if token present in cookie or Authorization header (non-blocking).
 */
const optionalAuth = async (req, res, next) => {
  try {
    let token = req.cookies.accessToken;
    
    // Fallback: intenta obtener del header Authorization
    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.slice(7);
      }
    }
    
    if (!token) {
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await User.findById(decoded.id).select('-password');
    
    if (user && user.isActive) {
      req.user = user;
    }
  } catch (err) {
    logger.debug('optionalAuth: invalid/expired token, continuing as guest', { message: err.message });
    // token invalid/expired - continue as guest
  }
  next();
};

module.exports = { protect, adminOnly, optionalAuth };
