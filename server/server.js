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

// --- NEW SYSTEM IMPORTS ---
const logger = require('./utils/logger');
const { errorHandler, notFound } = require('./middleware/errorMiddleware');
const morgan = require('morgan');
const mongoSanitize = require('express-mongo-sanitize');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

// Feature: Swagger Documentation
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

// Feature: Sentry Error Monitoring
const Sentry = require('@sentry/node');
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: 0.2,
  });
  logger.info('Sentry error monitoring initialized');
}

// Swagger specification
const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Quality Pulse API',
      version: '1.0.0',
      description: 'Construction Quality Assurance Management Platform REST API',
    },
    servers: [{ url: '/api', description: 'API Server' }],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./routes/*.js'],
});

// Handle uncaught exceptions synchronously
process.on('uncaughtException', (err) => {
  logger.error('UNCAUGHT EXCEPTION! 💥 Shutting down...', { error: err.stack });
  process.exit(1);
});
// ----------------------------

connectDB();

const app = express();
app.set('trust proxy', 1); // Trust Render's proxy for accurate rate limiting

const server = http.createServer(app);

// Build allowed origins list (merging environment variables with hardcoded production/local URLs)
const defaultOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://the-quality-pulse.vercel.app',
  'https://the-quality-pulse.onrender.com',
];
const envOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);
const allowedOrigins = [...new Set([...defaultOrigins, ...envOrigins])];

const corsOriginFn = (origin, callback) => {
  // Allow requests with no origin (mobile apps, server-to-server, curl)
  if (!origin) return callback(null, true);

  // Clean origin string (remove trailing slash if present)
  const cleanOrigin = origin.replace(/\/$/, '');

  if (allowedOrigins.some((ao) => ao.replace(/\/$/, '') === cleanOrigin)) {
    return callback(null, true);
  }

  return callback(new Error(`CORS: origin '${origin}' not allowed`));
};

// Enhanced Socket.IO configuration
const io = socketIo(server, {
  cors: {
    origin: corsOriginFn,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000,
  connectionStateRecovery: {
    maxDisconnectionDuration: 2 * 60 * 1000,
    skipMiddlewares: true,
  },
  allowEIO3: true, // For compatibility with older clients
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

// --- GLOBAL MIDDLEWARE ---
app.use(
  cors({
    origin: corsOriginFn,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

// Middleware
app.use(
  helmet({
    crossOriginResourcePolicy: false, // Allow image resources from Cloudinary
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"], // Allow inline scripts for React
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:', 'https://res.cloudinary.com', 'blob:'],
        connectSrc: ["'self'", ...allowedOrigins],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
      },
    },
  })
);
app.use(mongoSanitize()); // Prevent NoSQL Injection
app.use(compression()); // Compress outgoing response bodies

// General API Rate Limiting (300 req / 15 min per IP)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: 'Too many requests from this IP, please try again after 15 minutes.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', apiLimiter);

// Strict Auth Rate Limiting (10 req / 15 min per IP — brute-force protection)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many login attempts. Please wait 15 minutes before trying again.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Only count failed attempts
});

app.use(
  morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev', {
    stream: { write: (message) => logger.info(message.trim()) },
  })
);
// --- OTHER MIDDLEWARE ---

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

// Auth routes (with strict brute-force rate limiter on login/register)
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/forgot-password', authLimiter);

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/sites', require('./routes/sites'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/activities', require('./routes/audit'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/upload', uploadRoutes);
app.use('/api/notifications', notificationRoutes);

// Feature: Swagger UI (Interactive API Docs)
app.use(
  '/api/docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customCss:
      '.swagger-ui .topbar { background: #0f172a; } .swagger-ui .topbar-wrapper img { display: none; }',
    customSiteTitle: 'Quality Pulse API Docs',
  })
);
app.get('/api/docs.json', (req, res) => res.json(swaggerSpec));
app.use('/api/dashboard', dashboardRoutes);

// Development-only diagnostic routes (hidden in production)
if (process.env.NODE_ENV !== 'production') {
  app.use('/api/test', require('./routes/testRoutes'));
  app.use('/api/debug', require('./routes/debug'));
  logger.info('⚠️  Dev diagnostic routes enabled: /api/test, /api/debug');
}

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
      notifications: '/api/notifications',
    },
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
    userId: socket.userId || 'guest',
  });

  // User joins their own room (simplified)
  socket.on('joinUser', (userId) => {
    try {
      if (userId) {
        const roomName = `user_${userId}`;
        socket.join(roomName);

        // Remove from any previous user rooms
        const rooms = Array.from(socket.rooms);
        rooms.forEach((room) => {
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
          timestamp: new Date().toISOString(),
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
      latency: Date.now() - (data.timestamp || Date.now()),
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
        test: true,
      };

      io.to(`user_${userId}`).emit('newNotification', notification);
      console.log(`🔔 Test notification sent to user ${userId}: ${message}`);

      socket.emit('testNotificationResult', {
        success: true,
        userId,
        message: 'Test notification sent',
        notification,
      });
    }
  });

  // Handle disconnection
  socket.on('disconnect', (reason) => {
    console.log(
      `❌ Client ${socket.id} (user: ${socket.userId || 'unknown'}) disconnected. Reason:`,
      reason
    );
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
        sockets: Array.from(room).map((socketId) => ({
          id: socketId,
          connectedAt: io.sockets.sockets.get(socketId)?.handshake.time,
        })),
      })),
      serverTime: new Date().toISOString(),
    };

    res.json({
      success: true,
      ...status,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get socket status',
      error: error.message,
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
      test: true,
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
      metadata: { test: true },
    });

    res.json({
      success: true,
      message: 'Test notification sent',
      socketNotification: notification,
      dbNotification: dbNotification,
    });
  } catch (error) {
    console.error('Test notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send test notification',
      error: error.message,
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
      totalUsersConnected: Array.from(io.sockets.adapter.rooms.keys()).filter((r) =>
        r.startsWith('user_')
      ).length,
    };

    res.json({
      success: true,
      ...status,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get user socket status',
      error: error.message,
    });
  }
});

// Global Error Handlers (Should be after ALL routes)
app.use(notFound);
app.use(errorHandler);

// Start the server only if this file is run directly (not required as a module)
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  const runningServer = server.listen(PORT, '0.0.0.0', () => {
    logger.info(`🚀 Server running on http://0.0.0.0:${PORT}`);
    logger.info(`📡 Socket.IO ready for connections`);
    logger.info(`🔗 CORS enabled for: ${allowedOrigins.join(', ')}`);
  });

  // Handle unhandled promise rejections asynchronously
  process.on('unhandledRejection', (err) => {
    logger.error('UNHANDLED REJECTION! 💥 Shutting down...', { error: err.stack });
    runningServer.close(() => {
      process.exit(1);
    });
  });
}

// Export app instance (without the listen call) so Supertest can use it
module.exports = app;
