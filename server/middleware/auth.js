const jwt = require('jsonwebtoken');
const User = require('../models/User');

const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Authentication failed: No token provided or invalid format',
      });
    }

    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET || 'staffsync_super_secret_jwt_key_2025_hrms';

    const decoded = jwt.verify(token, secret);
    
    // Look up user from database to ensure user is active and exists
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication failed: User no longer exists',
      });
    }

    // Attach user object to request
    req.user = user;
    next();
  } catch (err) {
    console.error('[Auth Middleware] Verification error:', err.message);
    return res.status(401).json({
      success: false,
      error: 'Authentication failed: Invalid or expired token',
    });
  }
};

const requireRoles = (roles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
    }

    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    if (allowedRoles.length > 0 && !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `Access denied: Requires one of [${allowedRoles.join(', ')}] role. Current role: ${req.user.role}`,
      });
    }

    next();
  };
};

module.exports = {
  verifyToken,
  requireRoles,
};
