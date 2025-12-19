// controllers/notificationController.js
const Notification = require('../models/Notification');

// Delete a single notification
const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    // Verify the notification belongs to the current user
    if (notification.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this notification' });
    }

    await notification.deleteOne();
    
    res.json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to delete notification' 
    });
  }
};

// Clear all notifications for a user
const clearAllNotifications = async (req, res) => {
  try {
    // Verify the user is deleting their own notifications
    if (req.params.userId !== req.user._id.toString()) {
      return res.status(403).json({ 
        success: false,
        message: 'Not authorized' 
      });
    }

    await Notification.deleteMany({ 
      userId: req.user._id 
    });
    
    res.json({
      success: true,
      message: 'All notifications cleared successfully'
    });
  } catch (error) {
    console.error('Error clearing notifications:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to clear notifications' 
    });
  }
};

module.exports = {
  deleteNotification,
  clearAllNotifications
};