// server/routes/test.js
const express = require('express');
const router = express.Router();
const NotificationService = require('../services/notificationService');
const { protect, authorize } = require('../middleware/auth');

// Test notification for current user
router.get('/test-notification', protect, async (req, res) => {
  try {
    const io = req.app.get('io');
    const notification = await NotificationService.sendTestNotification(req.user._id, io);
    
    if (notification) {
      res.json({ 
        success: true, 
        message: 'Test notification sent successfully',
        notification 
      });
    } else {
      res.status(500).json({ 
        success: false, 
        message: 'Failed to send test notification' 
      });
    }
  } catch (error) {
    console.error('Test notification error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error sending test notification',
      error: error.message 
    });
  }
});

// Test assignment notification (Admin only)
router.post('/test-assignment/:engineerId', protect, authorize('Admin'), async (req, res) => {
  try {
    const { siteId } = req.body;
    const io = req.app.get('io');
    
    const notification = await NotificationService.notifyEngineerAssignedToSite(
      req.params.engineerId,
      siteId,
      req.user._id,
      io
    );
    
    if (notification) {
      res.json({ 
        success: true, 
        message: 'Assignment test notification sent successfully',
        notification 
      });
    } else {
      res.status(500).json({ 
        success: false, 
        message: 'Failed to send assignment test notification' 
      });
    }
  } catch (error) {
    console.error('Test assignment error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error sending test assignment',
      error: error.message 
    });
  }
});

module.exports = router;