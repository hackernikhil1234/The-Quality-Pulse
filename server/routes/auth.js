const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const { protect, authorize } = require('../middleware/auth');
const User = require('../models/User');
const NotificationService = require('../services/notificationService');
const emailService = require('../services/emailService');
const validateRequest = require('../middleware/validateRequest');
const {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} = require('../schemas');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret123';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'refresh_supersecret_123';

// Import your existing controllers
const { registerUser, loginUser, getMe } = require('../controllers/authController');

// Existing routes
router.post('/register', validateRequest(registerSchema), registerUser);
router.post('/login', validateRequest(loginSchema), loginUser);
router.get('/me', protect, getMe);

// ─── Feature 1: JWT Refresh Token ───────────────────────────────────────
router.post('/refresh-token', (req, res) => {
  const token = req.cookies?.refreshToken;
  if (!token) return res.status(401).json({ message: 'No refresh token provided' });
  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET);
    const newAccessToken = jwt.sign({ id: decoded.id }, JWT_SECRET, { expiresIn: '15m' });
    res.json({ token: newAccessToken });
  } catch (err) {
    return res
      .status(403)
      .json({ message: 'Invalid or expired refresh token. Please log in again.' });
  }
});

// ─── Feature 2: Forgot Password ──────────────────────────────────────────
router.post('/forgot-password', validateRequest(forgotPasswordSchema), async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });

    // Always respond generically to prevent email enumeration
    const genericMessage =
      'If an account with that email exists, a password reset link has been sent.';

    if (!user) {
      return res.json({ success: true, message: genericMessage });
    }

    // Generate a raw random token and store its hash
    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    user.passwordResetToken = hashedToken;
    user.passwordResetExpires = Date.now() + 60 * 60 * 1000; // 1 hour
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${rawToken}`;

    emailService
      .sendPasswordResetEmail({
        email: user.email,
        name: user.name,
        resetUrl,
      })
      .catch((err) => console.error('Password reset email failed (non-critical):', err.message));

    res.json({ success: true, message: genericMessage });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
});

// ─── Feature 3: Reset Password ───────────────────────────────────────────
router.post('/reset-password/:token', validateRequest(resetPasswordSchema), async (req, res) => {
  try {
    const { newPassword } = req.body;
    const { token } = req.params;

    // Hash the token from the URL to compare with stored hash
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: 'Password reset link is invalid or has expired.' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    await user.save();

    res.json({ success: true, message: 'Password reset successfully. You can now log in.' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
});

// ─── Feature 6: Two-Factor Authentication (2FA) ─────────────────────────
// Step 1: Generate 2FA Secret + QR Code
router.post('/2fa/setup', protect, async (req, res) => {
  try {
    const secret = speakeasy.generateSecret({
      name: `QualityPulse (${req.user.email})`,
      length: 20,
    });
    // Store temp secret on user until they verify
    await User.findByIdAndUpdate(req.user._id, { twoFactorTempSecret: secret.base32 });
    const qrCodeDataUrl = await QRCode.toDataURL(secret.otpauth_url);
    res.json({ qrCode: qrCodeDataUrl, secret: secret.base32 });
  } catch (err) {
    res.status(500).json({ message: 'Failed to setup 2FA' });
  }
});

// Step 2: Verify OTP and activate 2FA
router.post('/2fa/verify', protect, async (req, res) => {
  try {
    const { token } = req.body;
    const user = await User.findById(req.user._id);
    if (!user.twoFactorTempSecret)
      return res.status(400).json({ message: '2FA setup not initiated' });

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorTempSecret,
      encoding: 'base32',
      token,
      window: 2,
    });
    if (!verified) return res.status(400).json({ message: 'Invalid OTP code. Please try again.' });

    await User.findByIdAndUpdate(req.user._id, {
      twoFactorSecret: user.twoFactorTempSecret,
      twoFactorEnabled: true,
      twoFactorTempSecret: null,
    });
    res.json({ success: true, message: '2FA enabled successfully!' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to verify 2FA' });
  }
});

// Step 3: Disable 2FA
router.post('/2fa/disable', protect, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, {
      twoFactorSecret: null,
      twoFactorEnabled: false,
      twoFactorTempSecret: null,
    });
    res.json({ success: true, message: '2FA disabled.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to disable 2FA' });
  }
});

// Step 4: Validate 2FA token during login
router.post('/2fa/validate', async (req, res) => {
  try {
    const { userId, token } = req.body;
    const user = await User.findById(userId);
    if (!user || !user.twoFactorEnabled)
      return res.status(400).json({ message: 'Invalid request' });

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token,
      window: 2,
    });
    if (!verified) return res.status(401).json({ message: 'Invalid 2FA code' });

    const accessToken = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign({ id: user._id }, JWT_REFRESH_SECRET, { expiresIn: '30d' });
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });
    res.json({
      token: accessToken,
      user: { _id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to validate 2FA' });
  }
});

// Get users by role (for assigning engineers)
router.get('/users', protect, async (req, res) => {
  try {
    const { role } = req.query;
    const query = role ? { role } : {};
    const users = await User.find(query).select(
      'name email role avatar phone countryCode isActive'
    );
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
        deactivatedAt: user.deactivatedAt,
      },
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
        isActive: user.isActive,
      },
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

    const updatedUser = await User.findByIdAndUpdate(req.user._id, updateData, {
      new: true,
      runValidators: true,
    }).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('Profile updated successfully:', updatedUser);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating profile',
      error: error.message,
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
        message: 'All fields are required',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters',
      });
    }

    const user = await User.findById(req.user._id).select('+password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect',
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.updatedAt = Date.now();

    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({
      success: false,
      message: 'Error changing password',
      error: error.message,
    });
  }
});

module.exports = router;
