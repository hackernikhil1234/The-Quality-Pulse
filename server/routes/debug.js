// server/routes/debug.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');

// Check socket connection status for a user
router.get('/socket-status/:userId', protect, async (req, res) => {
  try {
    const io = req.app.get('io');
    const userId = req.params.userId;
    const roomName = `user_${userId}`;
    
    const room = io.sockets.adapter.rooms.get(roomName);
    const roomSize = room ? room.size : 0;
    
    // Get all connected sockets
    const sockets = Array.from(io.sockets.sockets.values());
    const userSockets = sockets.filter(socket => 
      Array.from(socket.rooms).includes(roomName)
    );
    
    res.json({
      success: true,
      userId,
      roomName,
      isConnected: roomSize > 0,
      connectionCount: roomSize,
      connectedSockets: userSockets.map(s => ({
        id: s.id,
        connectedAt: s.handshake.time,
        userAgent: s.handshake.headers['user-agent']
      })),
      totalSockets: sockets.length,
      allRooms: Array.from(io.sockets.adapter.rooms.keys())
        .filter(r => r.startsWith('user_'))
        .map(roomName => ({
          room: roomName,
          size: io.sockets.adapter.rooms.get(roomName)?.size || 0
        }))
    });
  } catch (error) {
    console.error('Debug socket status error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Send test notification to specific user
router.post('/test-notify/:userId', protect, async (req, res) => {
  try {
    const io = req.app.get('io');
    const NotificationService = require('../services/notificationService');
    
    const notification = await NotificationService.sendNotification({
      userId: req.params.userId,
      title: '🔧 Debug Test Notification',
      message: 'This is a test notification sent via the debug endpoint.',
      type: 'info',
      priority: 'medium',
      metadata: { debug: true, timestamp: new Date() },
      actionUrl: '/dashboard'
    }, io);
    
    if (notification) {
      res.json({ 
        success: true, 
        message: 'Test notification sent',
        notificationId: notification._id
      });
    } else {
      res.status(500).json({ 
        success: false, 
        message: 'Failed to send notification' 
      });
    }
  } catch (error) {
    console.error('Debug notify error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;