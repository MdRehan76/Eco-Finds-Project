const jwt = require('jsonwebtoken');
const { dbHelpers } = require('../database');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Get user from database to ensure they still exist
    const user = await dbHelpers.get(
      'SELECT id, username, email FROM users WHERE id = ?',
      [decoded.userId]
    );

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    } else {
      return res.status(500).json({ message: 'Token verification failed' });
    }
  }
};

// Middleware to check if user owns a resource
const checkOwnership = (resourceTable, resourceIdParam = 'id') => {
  return async (req, res, next) => {
    try {
      const resourceId = req.params[resourceIdParam];
      const userId = req.user.id;

      const resource = await dbHelpers.get(
        `SELECT * FROM ${resourceTable} WHERE id = ?`,
        [resourceId]
      );

      if (!resource) {
        return res.status(404).json({ message: 'Resource not found' });
      }

      // Check if user owns the resource
      const ownerField = resourceTable === 'products' ? 'seller_id' : 'user_id';
      if (resource[ownerField] !== userId) {
        return res.status(403).json({ message: 'Access denied' });
      }

      req.resource = resource;
      next();
    } catch (error) {
      console.error('Ownership check error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  };
};

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// Optional authentication middleware (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await dbHelpers.get(
      'SELECT id, username, email FROM users WHERE id = ?',
      [decoded.userId]
    );
    req.user = user;
  } catch (error) {
    req.user = null;
  }

  next();
};

module.exports = {
  authenticateToken,
  checkOwnership,
  generateToken,
  optionalAuth
};
