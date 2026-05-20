// src/middlewares/authMiddleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const dotenv = require('dotenv');
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

// ✅ Authentification requise
exports.protect = async (req, res, next) => {
  let token;
  try {
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (!token) {
      return res.status(401).json({ success: false, message: 'Non autorisé, aucun token fourni' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.id || decoded.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Token invalide: ID utilisateur manquant' });
    }

    req.user = await User.findById(userId).select('-password');
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Utilisateur introuvable' });
    }
    if (req.user.status !== 'actif') {
      return res.status(403).json({ success: false, message: 'Compte non actif. Contactez un administrateur.' });
    }

    req.user.lastLogin = new Date();
    await req.user.save();

    next();
  } catch (err) {
    console.error('Erreur token:', err);
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expiré' });
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, message: 'Token invalide' });
    }
    return res.status(401).json({ success: false, message: 'Erreur d\'authentification' });
  }
};

// ✅ Authentification optionnelle (ne bloque pas si token absent)
exports.optionalAuth = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (!token) {
      req.user = null;
      return next();
    }
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const userId = decoded.id || decoded.userId;
      req.user = userId ? await User.findById(userId).select('-password') : null;
    } catch {
      req.user = null;
    }
    next();
  } catch (error) {
    console.error('❌ Erreur optionalAuth:', error);
    req.user = null;
    next();
  }
};

// ✅ Admin uniquement
exports.admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') return next();
  return res.status(403).json({ success: false, message: 'Accès réservé aux administrateurs' });
};

// ✅ Restriction par rôle(s) — usage: restrictTo('admin', 'manager')
exports.restrictTo = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Non authentifié' });
  }
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ success: false, message: `Accès refusé - Rôle requis: ${roles.join(' ou ')}` });
  }
  next();
};

// ✅ Alias de restrictTo (compatibilité)
exports.requireRole = exports.restrictTo;

// ✅ Restriction par permission(s)
exports.requirePermission = (...permissions) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ success: false, message: 'Non authentifié' });
  const hasAll = permissions.every(p => req.user.permissions?.includes(p));
  if (hasAll) return next();
  return res.status(403).json({ success: false, message: `Permission(s) requise(s): ${permissions.join(', ')}` });
};