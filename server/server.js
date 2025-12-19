require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const uploadRoutes = require('./routes/upload');
const notificationRoutes = require('./routes/notifications');
const dashboardRoutes = require('./routes/dashboard');

connectDB();

const app = express();
const server = http.createServer(app);

// Enhanced Socket.IO configuration
const io = socketIo(server, {
  cors: {
    origin: 'http://localhost:5173',
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000,
  connectionStateRecovery: {
    maxDisconnectionDuration: 2 * 60 * 1000,
    skipMiddlewares: true,
  },
  allowEIO3: true // For compatibility with older clients
});

// Remove or comment out socketAuth if it's causing issues
// const socketAuth = require('./middleware/socketAuth');
// io.use(socketAuth);

// Simple authentication middleware (optional, uncomment if needed)
io.use((socket, next) => {
  try {
    // Get token if available
    const token = socket.handshake.query.token || socket.handshake.auth.token;
    
    if (token) {
      // Try to verify token if present
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      socket.userRole = decoded.role;
      console.log(`🔐 Authenticated socket for user: ${socket.userId}`);
    } else {
      console.log('🔓 Anonymous socket connection (will need to join room manually)');
    }
    
    next();
  } catch (error) {
    console.log('⚠️ Socket auth error (continuing anyway):', error.message);
    // Still allow connection
    next();
  }
});

// Middleware
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Serve static files from uploads directory
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser());

// Make io available to all routes
app.use((req, res, next) => {
  req.io = io;
  next();
});

app.set('io', io);

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/sites', require('./routes/sites'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/activities', require('./routes/audit'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/upload', uploadRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/test', require('./routes/test'));
app.use('/api/debug', require('./routes/debug'));

// Health check
app.get('/', (req, res) => {
  res.json({ 
    message: 'Construction QA Pro API', 
    version: '1.0.0',
    socketIo: true,
    endpoints: {
      auth: '/api/auth',
      sites: '/api/sites',
      reports: '/api/reports',
      notifications: '/api/notifications'
    }
  });
});

// ──────────────────────────────────────
// REAL-TIME NOTIFICATIONS (Simplified & More Reliable)
// ──────────────────────────────────────
io.on('connection', (socket) => {
  console.log('✅ New client connected:', socket.id, 'IP:', socket.handshake.address);
  
  // Send immediate welcome message
  socket.emit('connected', { 
    message: 'Connected to Construction QA Pro Server',
    socketId: socket.id,
    serverTime: new Date().toISOString(),
    userId: socket.userId || 'guest'
  });

  // User joins their own room (simplified)
  socket.on('joinUser', (userId) => {
    try {
      if (userId) {
        const roomName = `user_${userId}`;
        socket.join(roomName);
        
        // Remove from any previous user rooms
        const rooms = Array.from(socket.rooms);
        rooms.forEach(room => {
          if (room.startsWith('user_') && room !== roomName) {
            socket.leave(room);
          }
        });
        
        console.log(`👤 User ${userId} joined room: ${roomName}`);
        socket.userId = userId;
        
        // Send confirmation
        socket.emit('roomJoined', { 
          success: true,
          room: roomName, 
          userId: userId,
          timestamp: new Date().toISOString()
        });
        
        // Log room statistics
        const room = io.sockets.adapter.rooms.get(roomName);
        console.log(`📊 Room ${roomName} now has ${room ? room.size : 0} connections`);
      } else {
        console.error('⚠️ joinUser called without userId');
        socket.emit('error', { message: 'userId is required' });
      }
    } catch (error) {
      console.error('❌ Error in joinUser:', error);
      socket.emit('error', { message: 'Failed to join room', error: error.message });
    }
  });

  // User leaves their room
  socket.on('leaveUser', (userId) => {
    if (userId) {
      const roomName = `user_${userId}`;
      socket.leave(roomName);
      console.log(`👤 User ${userId} left room: ${roomName}`);
    }
  });

  // Test endpoint for debugging
  socket.on('ping', (data) => {
    console.log(`🏓 Ping from ${socket.id}:`, data);
    socket.emit('pong', { 
      message: 'Pong!',
      originalData: data,
      serverTime: new Date().toISOString(),
      latency: Date.now() - (data.timestamp || Date.now())
    });
  });

  // Manual notification test
  socket.on('testNotification', ({ userId, message }) => {
    if (userId && message) {
      const notification = { 
        _id: `test_${Date.now()}`,
        title: 'Test Notification',
        message: message,
        type: 'info',
        createdAt: new Date().toISOString(),
        read: false,
        test: true
      };
      
      io.to(`user_${userId}`).emit('newNotification', notification);
      console.log(`🔔 Test notification sent to user ${userId}: ${message}`);
      
      socket.emit('testNotificationResult', {
        success: true,
        userId,
        message: 'Test notification sent',
        notification
      });
    }
  });

  // Handle disconnection
  socket.on('disconnect', (reason) => {
    console.log(`❌ Client ${socket.id} (user: ${socket.userId || 'unknown'}) disconnected. Reason:`, reason);
  });

  // Error handling
  socket.on('error', (error) => {
    console.error(`❌ Socket ${socket.id} error:`, error);
  });
});

// Socket status endpoint
app.get('/api/socket-status', (req, res) => {
  try {
    const rooms = Array.from(io.sockets.adapter.rooms.entries());
    const userRooms = rooms.filter(([roomName]) => roomName.startsWith('user_'));
    
    const status = {
      totalConnections: io.engine.clientsCount,
      totalRooms: rooms.length,
      userRooms: userRooms.length,
      connectedUsers: userRooms.map(([roomName, room]) => ({
        userId: roomName.replace('user_', ''),
        connections: room.size,
        sockets: Array.from(room).map(socketId => ({
          id: socketId,
          connectedAt: io.sockets.sockets.get(socketId)?.handshake.time
        }))
      })),
      serverTime: new Date().toISOString()
    };
    
    res.json({
      success: true,
      ...status
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get socket status',
      error: error.message
    });
  }
});

// Test notification endpoint (for debugging)
app.post('/api/test-notification/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { title = 'Test Notification', message = 'This is a test notification' } = req.body;
    
    const notification = {
      _id: `manual_${Date.now()}`,
      title,
      message,
      type: 'info',
      createdAt: new Date().toISOString(),
      read: false,
      test: true
    };
    
    // Send via socket
    io.to(`user_${userId}`).emit('newNotification', notification);
    
    // Also save to database if you want
    const Notification = require('./models/Notification');
    const dbNotification = await Notification.create({
      userId,
      title,
      message,
      type: 'info',
      metadata: { test: true }
    });
    
    res.json({
      success: true,
      message: 'Test notification sent',
      socketNotification: notification,
      dbNotification: dbNotification
    });
  } catch (error) {
    console.error('Test notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send test notification',
      error: error.message
    });
  }
});

// Get user's notification room status
app.get('/api/user-socket-status/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const roomName = `user_${userId}`;
    const room = io.sockets.adapter.rooms.get(roomName);
    
    const status = {
      userId,
      roomName,
      isConnected: !!room && room.size > 0,
      connectionCount: room ? room.size : 0,
      socketIds: room ? Array.from(room) : [],
      totalUsersConnected: Array.from(io.sockets.adapter.rooms.keys())
        .filter(r => r.startsWith('user_')).length
    };
    
    res.json({
      success: true,
      ...status
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get user socket status',
      error: error.message
    });
  }
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📡 Socket.IO ready for connections`);
  console.log(`🔗 CORS enabled for: http://localhost:5173`);
});