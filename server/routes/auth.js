const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { protect, authorize } = require('../middleware/auth'); // Make sure authorize is imported
const User = require('../models/User');
const NotificationService = require('../services/notificationService');

// Import your existing controllers
const { registerUser, loginUser, getMe } = require('../controllers/authController');

// Existing routes
router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/me', protect, getMe);

// Get users by role (for assigning engineers)
router.get('/users', protect, async (req, res) => {
  try {
    const { role } = req.query;
    const query = role ? { role } : {};
    const users = await User.find(query).select('name email role avatar phone countryCode isActive');
    res.json(users);
  } catch (err) {
    console.error('Get users error:', err);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

// Deactivate user account (Admin only)
router.put('/:id/deactivate', protect, authorize('Admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot deactivate your own account' });
    }

    user.isActive = false;
    user.deactivatedBy = req.user._id;
    user.deactivatedAt = new Date();
    await user.save();

    // Notify user about deactivation
    const io = req.app.get('io');
    await NotificationService.notifyAccountDeactivated(user._id, req.user._id, io);

    res.json({ 
      success: true, 
      message: 'User account deactivated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isActive: user.isActive,
        deactivatedAt: user.deactivatedAt
      }
    });
  } catch (error) {
    console.error('Error deactivating user:', error);
    res.status(500).json({ message: 'Failed to deactivate user' });
  }
});

// Reactivate user account (Admin only)
router.put('/:id/reactivate', protect, authorize('Admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.isActive = true;
    user.deactivatedBy = null;
    user.deactivatedAt = null;
    await user.save();

    res.json({ 
      success: true, 
      message: 'User account reactivated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isActive: user.isActive
      }
    });
  } catch (error) {
    console.error('Error reactivating user:', error);
    res.status(500).json({ message: 'Failed to reactivate user' });
  }
});

// Update profile route
router.put('/profile', protect, async (req, res) => {
  try {
    const { name, phone, countryCode, avatar } = req.body;
    
    console.log('Updating profile for user:', req.user._id);
    console.log('Update data:', { name, phone, countryCode, avatar });
    
    const updateData = {};
    if (name) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (countryCode) updateData.countryCode = countryCode;
    if (avatar) updateData.avatar = avatar;
    
    // Also update updatedAt timestamp
    updateData.updatedAt = Date.now();
    
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    console.log('Profile updated successfully:', updatedUser);
    
    res.json({ 
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser 
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error updating profile',
      error: error.message 
    });
  }
});

// Change password route
router.put('/change-password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        success: false,
        message: 'All fields are required' 
      });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ 
        success: false,
        message: 'Password must be at least 6 characters' 
      });
    }
    
    const user = await User.findById(req.user._id).select('+password');
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }
    
    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ 
        success: false,
        message: 'Current password is incorrect' 
      });
    }
    
    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.updatedAt = Date.now();
    
    await user.save();
    
    res.json({ 
      success: true,
      message: 'Password changed successfully' 
    });
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error changing password',
      error: error.message 
    });
  }
});

module.exports = router;