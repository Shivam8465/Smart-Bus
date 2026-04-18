const jwt  = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  try {
    let token;

    // Check if token exists in request header
    if (req.headers.authorization && 
        req.headers.authorization.startsWith('Bearer')) {
      
      // Extract token from header
      // Header format: "Bearer eyJhbGc..."
      token = req.headers.authorization.split(' ')[1];
    }

    // No token found
    if (!token) {
      return res.status(401).json({ 
        message: 'Not authorized. No token provided.' 
      });
    }

    // Verify token is valid and not expired
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find the user this token belongs to
    // Exclude password from the result
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      return res.status(401).json({ 
        message: 'User not found.' 
      });
    }

    // Token is valid, allow request to continue
    next();

  } catch (error) {
    res.status(401).json({ 
      message: 'Not authorized. Invalid token.' 
    });
  }
};

// Middleware to check specific role
const authorizeRole = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Access denied. ${req.user.role} cannot access this route.` 
      });
    }
    next();
  };
};

module.exports = { protect, authorizeRole };
