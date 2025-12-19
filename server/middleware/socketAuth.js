// server/middleware/socketAuth.js
const jwt = require('jsonwebtoken');

const socketAuth = (socket, next) => {
  try {
    // Get token from handshake auth or query
    const token = socket.handshake.auth.token || 
                  socket.handshake.query.token;
    
    if (!token) {
      console.log('Socket connection attempt without token');
      return next(new Error('Authentication error: No token provided'));
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Attach user info to socket
    socket.userId = decoded.id;
    socket.userRole = decoded.role;
    
    console.log(`🔐 Authenticated socket for user: ${decoded.id}, role: ${decoded.role}`);
    next();
  } catch (error) {
    console.error('Socket authentication error:', error.message);
    next(new Error('Authentication error: Invalid token'));
  }
};

module.exports = socketAuth;