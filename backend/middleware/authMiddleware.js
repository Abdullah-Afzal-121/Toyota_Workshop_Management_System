const jwt  = require('jsonwebtoken');
const User = require('../models/User');

/**
 * verifyToken
 * Reads `Authorization: Bearer <token>` from header, verifies signature,
 * attaches `req.user` (Mongoose document, minus password) and `req.role`.
 *
 * Usage:  router.get('/protected', verifyToken, handler)
 */
const verifyToken = async (req, res, next) => {
  try {
    let token;
    
    // Check cookies first
    if (req.cookies && req.cookies.jwt_token) {
      token = req.cookies.jwt_token;
    } 
    // Fallback to Bearer token in headers for generic clients (e.g. mobile/postman without cookies)
    else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ message: 'No token provided. Please log in.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select('-password -__v');
    if (!user) return res.status(401).json({ message: 'Token user no longer exists.' });

    req.user = user;
    req.role = user.role;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Session expired. Please log in again.' });
    }
    return res.status(401).json({ message: 'Invalid token.' });
  }
};

/**
 * requireRole(...roles)
 * Factory that builds middleware allowing only the specified roles.
 *
 * Usage:  router.delete('/user/:id', verifyToken, requireRole('admin'), handler)
 */
const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: 'Not authenticated.' });
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({
      message: `Access denied. Required role(s): ${roles.join(', ')}.`,
    });
  }
  next();
};

module.exports = { verifyToken, requireRole };
