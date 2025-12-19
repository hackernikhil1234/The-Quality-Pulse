const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes - use this for existing routes
const protect = async (req, res, next) => {
  let token;

  if (req.cookies.jwt || (req.headers.authorization && req.headers.authorization.startsWith('Bearer'))) {
    token = req.cookies.jwt || req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecret123');
    req.user = await User.findById(decoded.id).select('-password');
    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    return res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

// Simple auth middleware for profile routes
const authMiddleware = async (req, res, next) => {
  let token;

  // Get token from Authorization header (Bearer token)
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }
  
  // Also check cookies
  if (!token && req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  try {
    // Verify token - check both possible token structures
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecret123');
    
    // Check if token has 'id' or 'user.id'
    const userId = decoded.id || (decoded.user && decoded.user.id);
    
    if (!userId) {
      return res.status(401).json({ message: 'Invalid token structure' });
    }
    
    req.user = await User.findById(userId).select('-password');
    
    if (!req.user) {
      return res.status(401).json({ message: 'User not found' });
    }
    
    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    return res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

// Authorize roles
const authorize = (...roles) => {
  return (req, res, next) => {
    console.log('Authorization check:'); // Debug
    console.log('User:', req.user); // Debug
    console.log('Required roles:', roles); // Debug
    console.log('User role:', req.user?.role); // Debug

    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `User role ${req.user.role} is not authorized to access this resource` 
      });
    }
    next();
  };
};

module.exports = { protect, authorize, authMiddleware };