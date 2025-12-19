// routes/notifications.js
const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const { protect } = require('../middleware/auth');
const notificationController = require('../controllers/notificationController');

const getIoFromRequest = (req) => {
  return req.app.get('io') || req.io || (req.app.get('socketio') ? req.app.get('socketio') : null);
};

// Send notification
router.post('/send', protect, async (req, res) => {
  try {
    const { userId, title, message, type, priority, metadata, actionUrl, expiresInHours } = req.body;

    const notification = await Notification.create({
      userId,
      title,
      message,
      type: type || 'info',
      priority: priority || 'medium',
      metadata: metadata || {},
      actionUrl,
      expiresAt: expiresInHours 
        ? new Date(Date.now() + expiresInHours * 60 * 60 * 1000)
        : undefined
    });

    // Here you can add real-time notification (Socket.io) or email notification

    res.json({
      success: true,
      message: 'Notification sent successfully',
      notification
    });
  } catch (error) {
    console.error('Error sending notification:', error);
    res.status(500).json({ message: 'Failed to send notification' });
  }
});

// Get user notifications
router.get('/user/:userId', protect, async (req, res) => {
  try {
    const notifications = await Notification.find({
      userId: req.params.userId,
      $or: [
        { expiresAt: { $exists: false } },
        { expiresAt: { $gt: new Date() } }
      ]
    })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Failed to fetch notifications' });
  }
});

// Mark notification as read
router.put('/:id/read', protect, async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { read: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json({
      success: true,
      message: 'Notification marked as read',
      notification
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ message: 'Failed to mark notification as read' });
  }
});

// Mark all as read
router.put('/user/:userId/mark-all-read', protect, async (req, res) => {
  try {
    await Notification.updateMany(
      {
        userId: req.params.userId,
        read: false
      },
      { read: true }
    );

    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to mark notifications as read' });
  }
});

// Delete
router.delete('/:id', protect, notificationController.deleteNotification);
router.delete('/user/:userId/clear-all', protect, notificationController.clearAllNotifications);

module.exports = router;